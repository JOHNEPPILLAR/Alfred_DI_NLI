'use strict';
const rp         = require('request-promise'),      
      dateFormat = require('dateformat'),
      Speech     = require('ssml-builder');

//=========================================================
// Setup logging
//=========================================================
exports.setLogger = function (logger) {
    if (process.env.environment == 'live'){
        // Send logging to a file
        logger.add(logger.transports.File, { filename: 'Alfred.log', timestamp: true, colorize: true });
        logger.remove(logger.transports.Console);
    } else {
        logger.remove(logger.transports.Console);
        logger.add(logger.transports.Console, {timestamp: function() { return dateFormat(new Date(), "dd mmm yyyy HH:MM") }, colorize: true});
    };
};

//=========================================================
// Construct and send JSON response back to caller
//=========================================================
exports.sendResponse = function (res, status, JSONobj) {
    // Construct the returning message
    var returnJSON = {
        code : status,
        data : JSONobj
    };

    // Send response back to caller
    res.send(returnJSON);
};

//=========================================================
// Call a remote API to get data
//=========================================================
exports.requestAPIdata = function (apiURL, userAgent) {
    var options = {
        'User-Agent': userAgent,
        method: 'GET',
        uri: apiURL,
        family: 4,
        resolveWithFullResponse: true,
        json: true
    }
    return rp(options);
};

//=========================================================
// Misc
//=========================================================
exports.processResponseText = function (OutputText) {
    if (OutputText!== null) {
        var speechObj = OutputText.match(/[^\.!\?]+[\.!\?]+/g),
            speech = new Speech();  

        // TODO fix ' with \' but only if it needs to be as some text already has the escape char

        speechObj.forEach(function(value) { // Construct ssml response
            speech.say(value);
            speech.pause('500ms');
        });
        return speech.ssml(true);
    } else {
        return 'There was an error processing the response text.';
    };
};


exports.isEmptyObject = function (obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        };
    };
    return true;
};

exports.GetSortOrder = function (prop) {
    return function (a, b) {
        if (a[prop] > b[prop]) {
            return 1;
        } else if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    }
}; 

/*
exports.addDays = function (date, amount) {
    var tzOff = date.getTimezoneOffset() * 60 * 1000,
        t = date.getTime(),
        d = new Date(),
        tzOff2;

    t += (1000 * 60 * 60 * 24) * amount;
    d.setTime(t);

    tzOff2 = d.getTimezoneOffset() * 60 * 1000;
    if (tzOff != tzOff2) {
        var diff = tzOff2 - tzOff;
        t += diff;
        d.setTime(t);
    };
    return d;
};
*/
