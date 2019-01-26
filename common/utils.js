const utils = {
    /**
     * Convert a query param string to a key-value JSON object
     * @param {string} query 
     * @return the param object
     */
    queryStringToObject: function (query) {
        let parameters = {};
        const parts = query.split("&");
        for (let part of parts) {
            const pair = part.split("=");
            parameters[pair[0]] = pair[1];
        }
        return parameters;
    },

    /**
     * Generate a acronym representing the difference between current 
     * datetime and the creation datetime of the tweet
     * 
     * Difference < 1 minute, => `now`
     * Difference > 1 minute and < 2 minutes, => `1m`
     * Difference > 2 minute and < 1 hour, => `xm`
     * Difference > 1 hour and < 2 hours, => `1h`
     * Difference > 2 hours and < 1 day, => `xh`
     * Difference == 1 day, => `YSTD`
     * Difference > 1 day and < 1 week, => `xd`
     * Difference > 1 week and < 1 month, => `xw`
     * 
     * @param {long} time the creation datetime of the tweet
     * @return the acronym string
     */
    prettyDate: function (time) {
        const date = new Date(time);
        const diff = (((new Date()).getTime() - date.getTime()) / 1000);
        const day_diff = Math.floor(diff / 86400);

        if (isNaN(day_diff) || day_diff < 0 || day_diff >= 31)
            return;

        return day_diff == 0 && (
            diff < 60 && "now" ||
            diff < 120 && "1m" ||
            diff < 3600 && Math.floor(diff / 60) + "m" ||
            diff < 7200 && "1h" ||
            diff < 86400 && Math.floor(diff / 3600) + "h") ||
            day_diff == 1 && "YSTD" ||
            day_diff < 7 && day_diff + "d" ||
            day_diff < 31 && Math.ceil(day_diff / 7) + "w";
    }
};

export {utils}