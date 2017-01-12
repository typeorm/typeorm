import { strPad } from "./StringUtils";

export class DateUtils {

    /**
     * Converts given value into date string in a "YYYY-MM-DD" format
     */
    public static dateToDateString(date: Date|string|number, localize?: boolean) {
        const dateObject = DateUtils.toDateObject(date, localize);
        return strPad(dateObject.getUTCFullYear(), 4) + "-" +
            strPad(dateObject.getUTCMonth() + 1, 2) + "-" +
            strPad(dateObject.getUTCDate(), 2);
    }

    /**
     * Converts given value into time string in a "HH:mm:ss" format
     */
    public static dateToTimeString(date: Date|string|number, localize?: boolean) {
        if (typeof date === "string" && date.length === 8) { // guess this is time only string
            date = "1970-01-01 " + date; // convert to full date
        }
        const dateObject = DateUtils.toDateObject(date, localize);
        return strPad(dateObject.getUTCHours(), 2) + ":" +
            strPad(dateObject.getUTCMinutes(), 2) + ":" +
            strPad(dateObject.getUTCSeconds(), 2);
    }

    /**
     * Converts given value into datetime string in a "YYYY-MM-DD HH:mm:ss" format
     */
    public static dateToDateTimeString(date: Date|string|number, localize?: boolean) {
        return DateUtils.dateToDateString(date, localize) + " " + DateUtils.dateToTimeString(date, localize);
    }

    /**
     * Converts given value into date object
     */
    public static toDateObject(date: any, localize?: boolean): Date {
        if (date instanceof Date) {
            if (localize)
                return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            return date;
        }
        switch (typeof date) {
            case "number":
                return new Date(date);
            case "string":
                if (date.length >= 19 && date.indexOf("+") === -1) { // set timezone to UTC if it's not set
                    date = date + "+0000";
                }
                return new Date(date);
        }
        return date;
    }

}