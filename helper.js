'use strict';
const rp = require('request-promise');

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
        resolveWithFullResponse: true,
        json: true
    }
    return rp(options);
};

//=========================================================
// Misc
//=========================================================
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

exports.minutesToStop = function (timeofnextbus) {
    var timetostopinMinutes = Math.floor(timeofnextbus / 60);
    switch (timetostopinMinutes) {
        case 0:
            return 'in less than a minute';
        case 1:
            return 'in ' + timetostopinMinutes + ' minute';
        default:
            return 'in ' + timetostopinMinutes + ' minutes';
    };
};
