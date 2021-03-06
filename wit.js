'use strict';

//=========================================================
// ToDo List
//=========================================================
/*
Commute: fran's commute & John's commute
TV
Lights

*/

//=========================================================
// Setup WIT
//=========================================================
const rp           = require('request-promise'),
      dateFormat   = require('dateformat');

dotenv.load() // Load env vars

//=========================================================
// Helper functions
//=========================================================
function firstEntityValue (entities, entity) {
    const val = entities && entities[entity] &&
          Array.isArray(entities[entity]) &&
          entities[entity].length > 0 &&
          entities[entity][0].value;
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
};

String.prototype.replaceAll = function (search, replacement) {
    const target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function strip(word) {
    return word.replaceAll('\'', '').replace(/\?/g, '');
};

function dataOK (Obj) {
    if (Obj.code == 'sucess') {
        return true;
    } else {
        return false;
    };
};

//=========================================================
// Process the request
//=========================================================
exports.getRequest = function(req, res, next) {

    var userRequest = strip(req.query.user_request),
        url         = process.env.ALFRED_DI_URL,
        IntentFound = true,
        AIintent    = 'default';

    if (typeof userRequest !== 'undefined' && userRequest !== null) { // Make sure param is not empty

        // Send user's request on to WIT.AI to see if we can get an intent from it
        WitClient.message(userRequest, {})
        .then(function(AIData){

            if (AIData.entities.intent[0].confidence < 0.8){
                alfredHelper.sendResponse(res, 'sucess', 'My internal processing was not able to accruatly match the request to any of my programming. I suggest you try it again.');
                return;
            };

            // If no intent returned from WAT.AI, default to search
            if (alfredHelper.isEmptyObject(AIData.entities.intent)) {
                IntentFound = false;
            } else {
                AIintent = AIData.entities.intent[0].value;
            };
            logger.info('Sugested intent: ' + AIintent)

            // Process the intent
            switch (AIintent.toLowerCase()) {
            // Search api mappings. Also used for no intent found mapping
            default:
                var errorMessage = 'There has been an error searching for your request.',
                    userQuery    = AIData._text,
                    messageText  = '';
                
                // Construct url
                url = url + '/search?app_key=' + process.env.app_key + '&search_term=' + userQuery;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    if (apiObj.body.code == 'sucess') {  // if sucess process the data
                        var apiData = apiObj.body;

                        if (!IntentFound){ // If no intent passed from WIT then prefix response
                            messageText = 'Hmmm, let me check with Google.' + apiData.data;
                        } else {
                            messageText = apiData.data;
                        };
                        alfredHelper.sendResponse(res, apiData.code, alfredHelper.processResponseText(messageText));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function (err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('search: ' + err);
                });
                break;

            // Generic api mappings
            case 'hello':
                var errorMessage = 'There has been an error. I am unable to say hello.';

                // Construct url
                url = url + '/hello?app_key=' + process.env.app_key;

                // Call the url and process data
                alfredHelper.requestAPIdata(url) // Call the api
                .then(function(apiObj) {
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('hello: ' + err);
                });
                break;         
            case 'help':
                var errorMessage = 'There has been an error. I am unable to help you.';
                url = url + '/help?app_key=' + process.env.app_key;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('help: ' + err);
                });
                break;

            // Joke api mappings
            case 'joke':
                var errorMessage = 'There has been an error. I am unable to tell you a joke.';

                // Construct url
                url = url + '/joke?app_key=' + process.env.app_key;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) {
                    var apiData = apiObj.body.data; // Call the api
                    if (apiObj.body.code == 'sucess') {  // if sucess process the data
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;

            // News api mappings
            case 'news':
                // Get entities
                var errorMessage = 'There has been an error. I am unable to tell you the news.',
                    news_type    = firstEntityValue(AIData.entities, 'search_query');

                if (typeof news_type !== 'undefined' && news_type !== null) { // Only process api accepted news types
                    switch (news_type) {
                    case 'news':
                        break;
                    case 'sports':
                        break;
                    case 'science':
                        break;
                    case 'tech':
                        break;
                    case 'business':
                        break;
                    default:
                        news_type = 'news';
                        break;
                    };
                    // Construct url
                    url = url + '/news?app_key=' + process.env.app_key + '&news_type=' + news_type;
                };

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData         = apiObj.body.data,
                        outputHeadlines = 'Here are the headlines: ';

                    if (apiObj.body.code == 'sucess') {
                        switch (news_type) { // Construct the headlines depending upon the type of news as some are return different data
                        case 'news':
                            apiData.forEach(function(value) {
                                outputHeadlines = outputHeadlines + value.title + '. ';
                            });
                            break;
                        case 'sports':
                            apiData.forEach(function(value) {
                                outputHeadlines = outputHeadlines + value.title + '. ';
                            });
                            break;
                        case 'science':
                            apiData.forEach(function(value) {
                                outputHeadlines = outputHeadlines + value.title + '. ';
                            });
                            break;
                        case 'tech':
                            apiData.forEach(function(value) {
                                outputHeadlines = outputHeadlines + value.title + '. ';
                            });
                            break;
                        case 'business':
                            apiData.forEach(function(value) {
                                outputHeadlines = outputHeadlines + value.title + '. ';
                            });
                            break;
                        };
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(outputHeadlines));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('news: ' + err);
                });
                break;

            // Time api mappings
            case 'time':
                // Get entities
                var errorMessage = 'There has been an error. I am unable to tell you the time.',
                    location     = firstEntityValue(AIData.entities, 'location');

                if (typeof location !== 'undefined' && location !== null) {
                    location = '&location=' + location;
                } else {
                    location = '';
                };

                // Construct url
                url = url + '/whatisthetime?app_key=' + process.env.app_key + location;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;

            // Weather api mappings
            case 'snow':
                // Get entities
                var errorMessage      = 'There has been an error. I am unable to tell you if it will snow.',
                    location          = firstEntityValue(AIData.entities, 'location'),
                    willItSnowMessage = '',
                    locationMsg       = '.',
                    today             = true,
                    requesteddate     = dateFormat(firstEntityValue(AIData.entities, 'datetime'), "yyyy-mm-dd"),
                    datetoday         = dateFormat(Date.now(), "yyyy-mm-dd"),
                    weatherFor        = 'today',
                    baseUrl           = url;

                if (typeof location !== 'undefined' && location !== null) {
                    locationMsg = ' in ' + location + '.';
                    location = '&location=' + location;
                } else {
                    location = '';
                };

                // Construct url                
                url = baseUrl + '/weather/willitsnow?app_key=' + process.env.app_key + location;
                if (requesteddate != datetoday) {
                    weatherFor = 'tomorrow';
                    url = baseUrl + '/weather/tomorrow?app_key=' + process.env.app_key + location;
                };
                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        if (weatherFor == 'today') { // Process data
                            if (apiData.going_to_snow){ // If the volume of snow is >0 it's snowing
                                willItSnowMessage = 'It\'s currently snowing' + locationMsg;
                            } else {
                                willItSnowMessage = 'It\'s not currently snowing' + locationMsg;
                            };
                        } else {
                            if (apiData.tomorrow_morning.SnowVolume==0 || apiData.tomorrow_evening.SnowVolume==0){ // If the volume of snow is >0 it's snowing
                                willItSnowMessage = 'It\'s not going to snow in the next 5 days' + locationMsg;
                            } else {
                                willItSnowMessage = 'It\'s going to snow in the next 5 days' + locationMsg;
                            };
                        };
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(willItSnowMessage));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;

            case 'weather':
                // Get entities
                var errorMessage       = 'There has been an error. I am unable to tell you the weather.',
                    location           = firstEntityValue(AIData.entities, 'location'),
                    requesteddate      = dateFormat(firstEntityValue(AIData.entities, 'datetime'), "yyyy-mm-dd"),
                    datetoday          = dateFormat(Date.now(), "yyyy-mm-dd"),
                    weatherFor         = 'today',
                    weatherMessage     = '',
                    weatherLocationMsg = '';

                if (requesteddate != datetoday) {
                    weatherFor = 'tomorrow';
                };

                if (typeof location !== 'undefined' && location !== null) {
                    weatherLocationMsg = ' in ' + location;
                    location           = '&location=' + location;
                } else {
                    location = '';
                };

                // Construct url
                url = url + '/weather/' + weatherFor + '?app_key=' + process.env.app_key + location;;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData = apiObj.body.data;

                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        if (weatherFor == 'today') { // Process todays weather data
                            weatherMessage = 'Currently' + weatherLocationMsg +
                                                ' it\'s ' + apiData.CurrentTemp.toFixed(0) + ' degrees with ' + 
                                                apiData.Summary + '.';
                            // Send response back to alexa
                            alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(weatherMessage));
                        } else { // Process tomorrows weather data
                            weatherMessage = 'Tomorrow morning' + weatherLocationMsg + ' will be ' + apiData.tomorrow_morning.Summary +
                                                ' with a high of ' + apiData.tomorrow_morning.MaxTemp.toFixed(0) +
                                                ' and a low of ' + apiData.tomorrow_morning.MinTemp.toFixed(0) + '.' + 
                                                ' Tomorrow afternoon will be ' + apiData.tomorrow_evening.Summary +
                                                ' and an average of ' + apiData.tomorrow_evening.Temp.toFixed(0) + ' degrees';

                            // Send response back to alexa
                            alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(weatherMessage));
                        };    
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));    
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;

            // Travel api mappings
            case 'nextbus':
                // Get entities
                var errorMessage = 'There has been an error. I am unable to tell you when the next bus is.',
                    busroute = '&bus_route=380'; // hard code as this is the local bus

                // Construct url
                url = url + '/travel/nextbus?app_key=' + process.env.app_key + busroute;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;
            case 'busstatus':
                // Get entities
                var errorMessage = 'There has been an error. I am unable to tell you the bus status information.',
                    busroute     = firstEntityValue(AIData.entities, 'number');

                if (typeof busroute !== 'undefined' && busroute !== null) {
                    busroute = '&bus_route=' + busroute;
                } else {
                    busroute = '&bus_route=380'; // Default to local bus route
                };

                // Construct url
                url = url + '/travel/busstatus?app_key=' + process.env.app_key + busroute;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;

            case 'nexttrain':
                // Get entities
                var errorMessage = 'There has been an error. I am unable to tell you when the next train is.',
                    destination  = firstEntityValue(AIData.entities, 'location');

                if (typeof destination !== 'undefined' && destination !== null) {
                    switch (destination.toLowerCase()) {
                        case 'cannon street':
                            destination = 'CST';
                            break;
                        case 'charing cross':
                            destination = 'CHX';
                            break;
                        default:
                            destination = 'CHX';
                            break;
                    };
                    destination = '&train_destination=' + destination;
                } else {
                    destination = '&train_destination=CHX'; // Default to local CHX
                };

                // Construct url
                url = url + '/travel/nexttrain?app_key=' + process.env.app_key + destination;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) { // Call the api
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') { // if sucess process the data
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else { // if error return a nice message
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) { // if error return a nice message
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;





           

            };
            next();
        })
        .catch(function (err) {
            alfredHelper.sendResponse(res, 'error', 'There was an error calling the natural langiage processing logic');
            logger.error('getRequest: ' + err);
        })
    } else {
        alfredHelper.sendResponse(res, 'error', 'The user request parameter was not supplied to the middleware api.');
        logger.error('getRequest: The user_request parameter was not supplied.');
    };
};
