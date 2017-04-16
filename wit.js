'use strict';

//=========================================================
// Setup WIT
//=========================================================
const rp           = require('request-promise'),
      dateFormat   = require('dateformat');

// Load env vars
dotenv.load()

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
        url         = process.env.ALFRED_DI_URL;

    if (typeof userRequest !== 'undefined' && userRequest !== null) {

        // Send user's request on to WIT.AI to see if we can get an intent from it
        WitClient.message(userRequest, {})
        .then(function(AIData){

            // If no intent returned from WAT.AI the default to search
            if (alfredHelper.isEmptyObject(AIData.entities.intent)) {
                var AIintent = 'search';
            } else {
                var AIintent = AIData.entities.intent[0].value;
            };
            logger.info('Intent: ' + AIintent)

            switch (AIintent.toLowerCase()) {

            case 'hello':
                var errorMessage = 'There has been an error. I am unable to say hello.';
                url = url + '/hello?app_key=' + process.env.app_key;
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) {
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') {
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else {
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) {
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('hello: ' + err);
                });
                break;

            case 'help':
                var errorMessage = 'There has been an error. I am unable to help you.';
                url = url + '/help?app_key=' + process.env.app_key;
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) {
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') {
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else {
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) {
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('help: ' + err);
                });
                break;

            case 'joke':
                var errorMessage = 'There has been an error. I am unable to tell you a joke.';
                url = url + '/joke?app_key=' + process.env.app_key;
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) {
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') {
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else {
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) {
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;

            case 'news':
                // Get entities
                var errorMessage = 'There has been an error. I am unable to tell you the news.',
                    news_type    = firstEntityValue(AIData.entities, 'search_query');

                if (typeof news_type !== 'undefined' && news_type !== null) {
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
                    url = url + '/news?app_key=' + process.env.app_key + '&news_type=' + news_type;
                };

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) {
                    var apiData         = apiObj.body.data,
                        outputHeadlines = 'Here are the headlines: ';

                    if (apiObj.body.code == 'sucess') {
                        switch (news_type) {
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
                    } else {
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) {
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('news: ' + err);
                });
                break;

            case 'time':
                // Get entities
                var errorMessage = 'There has been an error. I am unable to tell you a joke.',
                    location     = firstEntityValue(AIData.entities, 'location');

                if (typeof location !== 'undefined' && location !== null) {
                    location = '&location=' + location;
                } else {
                    location = '';
                };

                url = url + '/whatisthetime?app_key=' + process.env.app_key + location;
                alfredHelper.requestAPIdata(url)
                .then(function(apiObj) {
                    var apiData = apiObj.body.data;
                    if (apiObj.body.code == 'sucess') {
                        // Send response back to alexa
                        alfredHelper.sendResponse(res, 'sucess', alfredHelper.processResponseText(apiData));
                    } else {
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function(err) {
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('joke: ' + err);
                });
                break;

/*
            case 'snow':
                // Get entities
                var location = firstEntityValue(AIData.entities, 'location');
                if (typeof location !== 'undefined' && location !== null) {
                    location = '&location=' + location;
                } else {
                    location = '';
                };

                // Construct url
                url = url + '/weather/willitsnow?app_key=' + process.env.app_key + location;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiData){
                    // Get the weather data
                    apiData = apiData.body;

                    // Send response back to caller
                    alfredHelper.sendResponse(res, apiData.code, apiData.data);
                })
                .catch(function (err) {
                    // Send response back to caller
                    alfredHelper.sendResponse(res, 'error', err.message);
                    console.log('wit: ' + err);
                });
                break;
            case 'weather':
                // Get entities
                var location      = firstEntityValue(AIData.entities, 'location'),
                    willitsnow    = firstEntityValue(AIData.entities, 'snow'),
                    requesteddate = dateFormat(firstEntityValue(AIData.entities, 'datetime'), "yyyy-mm-dd"),
                    datetoday     = dateFormat(Date.now(), "yyyy-mm-dd"),
                    weatherFor    = 'today';

                if (requesteddate != datetoday) {
                    weatherFor = 'tomorrow';
                };

                // Construct url
                url = url + '/weather/' + weatherFor + '?app_key=' + process.env.app_key + '&';

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiData){
                    // Get the weather data
                    apiData = apiData.body;

                    // Send response back to caller
                    alfredHelper.sendResponse(res, apiData.code, apiData.data);
                })
                .catch(function (err) {
                    // Send response back to caller
                    alfredHelper.sendResponse(res, 'error', err.message);
                    console.log('wit: ' + err);
                });
                break;

                // Construct url
                url = url + '/joke?app_key=' + process.env.app_key;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiData){
                    // Get the joke data
                    apiData = apiData.body;

                    // Send response back to caller
                    alfredHelper.sendResponse(res, apiData.code, apiData.data);
                })
                .catch(function (err) {
                    // Send response back to caller
                    alfredHelper.sendResponse(res, 'error', err.message);
                    console.log('wit: ' + err);
                });
                break;

           
           
           
           
           

*/
            default:
                //logger.info ('No intent returned so going to pass to search skill');
                var errorMessage = 'There has been an error searching for your request.',
                    userQuery    = AIData._text;
                
                // Construct url
                url = url + '/search?app_key=' + process.env.app_key + '&search_term=' + userQuery;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiData) {
                    if (apiObj.body.code == 'sucess') {
                        apiData = apiData.body;
                        alfredHelper.sendResponse(res, apiData.code, alfredHelper.processResponseText(apiData.data));
                    } else {
                        alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    };
                })
                .catch(function (err) {
                    alfredHelper.sendResponse(res, 'error', alfredHelper.processResponseText(errorMessage));
                    logger.error('search: ' + err);
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
