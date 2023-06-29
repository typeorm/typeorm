"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateUtils = void 0;
/**
 * Provides utilities to transform hydrated and persisted data.
 */
class DateUtils {
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------
    /**
     * Normalizes date object hydrated from the database.
     */
    static normalizeHydratedDate(mixedDate) {
        if (!mixedDate)
            return mixedDate;
        return typeof mixedDate === "string" ? new Date(mixedDate) : mixedDate;
    }
    /**
     * Converts given value into date string in a "YYYY-MM-DD" format.
     */
    static mixedDateToDateString(value) {
        if (value instanceof Date)
            return this.formatZerolessValue(value.getFullYear()) + "-" + this.formatZerolessValue(value.getMonth() + 1) + "-" + this.formatZerolessValue(value.getDate());
        return value;
    }
    /**
     * Converts given value into date object.
     */
    static mixedDateToDate(mixedDate, toUtc = false, useMilliseconds = true) {
        let date = typeof mixedDate === "string" ? new Date(mixedDate) : mixedDate;
        if (toUtc)
            date = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
        if (!useMilliseconds)
            date.setUTCMilliseconds(0);
        return date;
    }
    /**
     * Converts given value into time string in a "HH:mm:ss" format.
     */
    static mixedDateToTimeString(value, skipSeconds = false) {
        if (value instanceof Date)
            return this.formatZerolessValue(value.getHours()) +
                ":" + this.formatZerolessValue(value.getMinutes()) +
                (!skipSeconds ? ":" + this.formatZerolessValue(value.getSeconds()) : "");
        return value;
    }
    /**
     * Converts given value into time string in a "HH:mm:ss" format.
     */
    static mixedTimeToDate(value) {
        if (typeof value === "string") {
            const [hours, minutes, seconds] = value.split(":");
            const date = new Date();
            if (hours)
                date.setHours(parseInt(hours));
            if (minutes)
                date.setMinutes(parseInt(minutes));
            if (seconds)
                date.setSeconds(parseInt(seconds));
            return date;
        }
        return value;
    }
    /**
     * Converts given string value with "-" separator into a "HH:mm:ss" format.
     */
    static mixedTimeToString(value, skipSeconds = false) {
        value = value instanceof Date ? (value.getHours() + ":" + value.getMinutes() + (!skipSeconds ? ":" + value.getSeconds() : "")) : value;
        if (typeof value === "string") {
            return value.split(":")
                .map(v => v.length === 1 ? "0" + v : v) // append zero at beginning if we have a first-zero-less number
                .join(":");
        }
        return value;
    }
    /**
     * Converts given value into datetime string in a "YYYY-MM-DD HH-mm-ss" format.
     */
    static mixedDateToDatetimeString(value, useMilliseconds) {
        if (typeof value === "string") {
            value = new Date(value);
        }
        if (value instanceof Date) {
            let finalValue = this.formatZerolessValue(value.getFullYear()) + "-" +
                this.formatZerolessValue(value.getMonth() + 1) + "-" +
                this.formatZerolessValue(value.getDate()) + " " +
                this.formatZerolessValue(value.getHours()) + ":" +
                this.formatZerolessValue(value.getMinutes()) + ":" +
                this.formatZerolessValue(value.getSeconds());
            if (useMilliseconds)
                finalValue += `.${this.formatMilliseconds(value.getMilliseconds())}`;
            value = finalValue;
        }
        return value;
    }
    /**
     * Converts given value into utc datetime string in a "YYYY-MM-DD HH-mm-ss.sss" format.
     */
    static mixedDateToUtcDatetimeString(value) {
        if (typeof value === "string") {
            value = new Date(value);
        }
        if (value instanceof Date) {
            return this.formatZerolessValue(value.getUTCFullYear()) + "-" +
                this.formatZerolessValue(value.getUTCMonth() + 1) + "-" +
                this.formatZerolessValue(value.getUTCDate()) + " " +
                this.formatZerolessValue(value.getUTCHours()) + ":" +
                this.formatZerolessValue(value.getUTCMinutes()) + ":" +
                this.formatZerolessValue(value.getUTCSeconds()) + "." +
                this.formatMilliseconds(value.getUTCMilliseconds());
        }
        return value;
    }
    /**
     * Converts each item in the given array to string joined by "," separator.
     */
    static simpleArrayToString(value) {
        if (Array.isArray(value)) {
            return value
                .map(i => String(i))
                .join(",");
        }
        return value;
    }
    /**
     * Converts given string to simple array split by "," separator.
     */
    static stringToSimpleArray(value) {
        if (value instanceof String || typeof value === "string") {
            if (value.length > 0) {
                return value.split(",");
            }
            else {
                return [];
            }
        }
        return value;
    }
    static simpleJsonToString(value) {
        return JSON.stringify(value);
    }
    static stringToSimpleJson(value) {
        return typeof value === "string" ? JSON.parse(value) : value;
    }
    static simpleEnumToString(value) {
        return "" + value;
    }
    static stringToSimpleEnum(value, columnMetadata) {
        if (columnMetadata.enum
            && !isNaN(value)
            && columnMetadata.enum.indexOf(parseInt(value)) >= 0) {
            // convert to number if that exists in poosible enum options
            value = parseInt(value);
        }
        return value;
    }
    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------
    /**
     * Formats given number to "0x" format, e.g. if it is 1 then it will return "01".
     */
    static formatZerolessValue(value) {
        if (value < 10)
            return "0" + value;
        return String(value);
    }
    /**
     * Formats given number to "0x" format, e.g. if it is 1 then it will return "01".
     */
    static formatMilliseconds(value) {
        if (value < 10) {
            return "00" + value;
        }
        else if (value < 100) {
            return "0" + value;
        }
        else {
            return String(value);
        }
    }
}
exports.DateUtils = DateUtils;

//# sourceMappingURL=DateUtils.js.map
