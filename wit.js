'use strict';

//=========================================================
// Setup WIT
//=========================================================
const rp           = require('request-promise'),
      dotenv       = require('dotenv'),
      Wit          = require('node-wit').Wit,
      alfredHelper = require('./helper.js'),
      dateFormat   = require('dateformat');

// Load env vars
dotenv.load()

// Setup WIT
const WitClient = new Wit({accessToken: process.env.WIT_TOKEN});

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
exports.getRequest = function (req, res, next) {

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
            console.log('Intent: ' + AIintent)

            switch (AIintent.toLowerCase()) {
            case 'news':
                // Get entities
                var news_type = firstEntityValue(AIData.entities, 'search_query');

                if (typeof news_type !== 'undefined' && news_type !== null) {
                    url = url + '/news?app_key=' + process.env.app_key + '&news_type=' + news_type;
                } else {
                    url = url + '/news?app_key=' + process.env.app_key + '&news_type=news';
                };

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiData) {
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
            case 'time':
                // Get entities
                var location = firstEntityValue(AIData.entities, 'location');
                if (typeof location !== 'undefined' && location !== null) {
                    location = '&location=' + location;
                } else {
                    location = '';
                };

                // Construct url
                url = url + '/whatisthetime?app_key=' + process.env.app_key + location;

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
            case 'joke':
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
            default:
                console.log ('No intent returned so going to pass to search skill');

                // Get entities
                var userQuery = AIData._text;
                
                // Construct url
                url = url + '/search?app_key=' + process.env.app_key + '&search_term=' + userQuery;

                // Call the url and process data
                alfredHelper.requestAPIdata(url)
                .then(function(apiData) {
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
            };
            next();
        })
        .catch(function (err) {
            // Send response back to caller
            alfredHelper.sendResponse(res, 'error', err.message);
            console.log('getRequest: ' + err);
        })
    } else {
        // Send response back to caller
        alfredHelper.sendResponse(res, 'error', 'The user_request parameter was not supplied.');
        console.log('getRequest: The user_request parameter was not supplied.');
    };
};
