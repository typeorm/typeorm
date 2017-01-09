import * as moment from "moment";

/**
 * Provides utilities to transform hydrated and persisted data.
 */
export class DataTransformationUtils {

    /**
     * Converts given value into date string in a "YYYY-MM-DD" format.
     */
    static mixedDateToDateString(value: Date|any, localize: boolean = false): string|any {
        return DataTransformationUtils.formatMixedDateWithMoment(value, "YYYY-MM-DD", localize);
    }

    /**
     * Converts given value into time string in a "HH:mm:ss" format.
     */
    static mixedDateToTimeString(value: Date|any, localize: boolean = false): string|any {
        let inputFormat;
        // specify format if we think this string contains time only or else moment will return invalid date
        if (typeof value === "string" && value.length < 19) {
            inputFormat = "HH:mm:ss";
        }
        return DataTransformationUtils.formatMixedDateWithMoment(value, "HH:mm:ss", localize, inputFormat);
    }

    /**
     * Converts given value into datetime string in a "YYYY-MM-DD HH:mm:ss" format.
     */
    static mixedDateToDatetimeString(value: Date|any, localize: boolean = false): string|any {
        return DataTransformationUtils.formatMixedDateWithMoment(value, "YYYY-MM-DD HH:mm:ss", localize);
    }

    /**
     * Converts given value into Date object
     */
    static mixedDateTimeToDate(value: Date|any, localize: boolean = false): Date {
        const instance = localize ? moment(value) : moment.utc(value);
        return instance.toDate();
    }

    /**
     * Converts each item in the given array to string joined by "," separator.
     */
    static simpleArrayToString(value: any[]|any): string[]|any {
        if (value instanceof Array) {
            return (value as any[])
                .map(i => String(i))
                .join(",");
        }

        return value;
    }

    /**
     * Converts given string to simple array split by "," separator.
     */
    static stringToSimpleArray(value: string|any): string|any {
        if (value instanceof String || typeof value === "string") {
            return value.split(",");
        }

        return value;
    }

    /**
     * Formats given value to a given format
     */
    private static formatMixedDateWithMoment(value: any, outputFormat: string, localize?: boolean, inputFormat?: string) {
        const instance = localize ? moment(value, inputFormat) : moment.utc(value, inputFormat);
        return instance.format(outputFormat);
    }

}
