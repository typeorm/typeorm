/**
 * Provides utilities to transform hydrated and persisted data.
 */
export class DataTransformationUtils {

    /**
     * Converts given value into date string in a "YYYY-MM-DD" format.
     */
    static mixedDateToDateString(value: Date|any): string|any {
        if (value instanceof Date) {
            value = DataTransformationUtils.localizeDate(value);
            return value.toISOString().substring(0, 10);
        }
        return value;
    }

    /**
     * Converts given value into time string in a "HH:mm:ss" format.
     */
    static mixedDateToTimeString(value: Date|any): string|any {
        if (value instanceof Date) {
            value = DataTransformationUtils.localizeDate(value);
            return value.toISOString().substr(11, 8);
        }
        return value;
    }

    /**
     * Converts given string value with "-" separator into a "HH:mm:ss" format.
     */
    static mixedTimeToString(value: string|any): string|any {
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
    static mixedDateToDatetimeString(value: Date|any): string|any {
        if (typeof value === "string") {
            value = new Date(value);
        }
        if (value instanceof Date) {
            value = DataTransformationUtils.localizeDate(value);
            return value.toISOString().slice(0, 19).replace('T', ' ');
        }

        return value;
    }

    /**
     * Converts given value into utc datetime string in a "YYYY-MM-DD HH-mm-ss" format.
     */
    static mixedDateToUtcDatetimeString(value: Date|any): string|any {
        if (typeof value === "string") {
            value = new Date(value);
        }
        if (value instanceof Date) {
            return value.toISOString().slice(0, 19).replace('T', ' ');
        }

        return value;
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

    private static localizeDate(date: Date): Date {
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));   
    }
}
