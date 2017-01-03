const moment = require("moment-timezone");
const _ = require("lodash");


module.exports = function (field, start, end, timezone) {

    // get range as moments
    start = moment(start);
    end = moment(end);


    // get zone information
    const zone = moment.tz.zone(timezone);


    // find timezone offset boundaries for the specified range
    const boundaries = [];
    _.each(zone.untils, (until, i) => {
        const offset = zone.offsets[i];
        if (until > start.valueOf()) {
            boundaries.push({ until, offset });
            if (until > end.valueOf()) {
                return false;
            }
        }
    });


    // recursively build condition structure
    function getCondition(boundaries) {
        const boundary = boundaries.shift();
        const until = boundary.until;
        const offset = boundary.offset * 60 * 1000; // minutes -> milliseconds

        if (boundaries.length == 0) {
            return { $subtract: [field, offset] };
        }

        return {
            $cond: {
                if: { $lt: [field, new Date(until)] },
                then: { $subtract: [field, offset] },
                else: getCondition(boundaries)
            }
        }
    }


    return getCondition(boundaries);
};

