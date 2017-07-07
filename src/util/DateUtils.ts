/**
 * Provides utilities to transform hydrated and persisted data.
 */
export class DateUtils {

    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Normalizes date object hydrated from the database.
     */
    static normalizeHydratedDate(mixedDate: Date|string|undefined): Date|string|undefined {
        if (!mixedDate)
            return mixedDate;

        const date = typeof mixedDate === "string" ? new Date(mixedDate) : mixedDate as Date;
        // if (!storedInLocal) {

        // else if it was not stored in local timezone, means it was stored in UTC
        // because driver hydrates it with timezone applied why we need to add timezone hours to match a local timezone

        const correctedDate = new Date();
        correctedDate.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        correctedDate.setUTCHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
        return correctedDate;
        // }
        // return date;
    }

    /**
     * Converts given value into date string in a "YYYY-MM-DD" format.
     */
    static mixedDateToDateString(value: Date|any): string|any {
        if (value instanceof Date)
            return this.formatZerolessValue(value.getFullYear()) + "-" + this.formatZerolessValue(value.getMonth() + 1) + "-" + this.formatZerolessValue(value.getDate());

        return value;
    }

    /**
     * Converts given value into time string in a "HH:mm:ss" format.
     */
    static mixedDateToTimeString(value: Date|any): string|any {
        if (value instanceof Date)
            return this.formatZerolessValue(value.getHours()) + ":" + this.formatZerolessValue(value.getMinutes()) + ":" + this.formatZerolessValue(value.getSeconds());

        return value;
    }

    /**
     * Converts given string value with "-" separator into a "HH:mm:ss" format.
     */
    static mixedTimeToString(value: string|any): string|any {
        value = value instanceof Date ? (value.getHours() + ":" + value.getMinutes() + ":" + value.getSeconds()) : value;
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
            return this.formatZerolessValue(value.getFullYear()) + "-" +
                this.formatZerolessValue(value.getMonth() + 1) + "-" +
                this.formatZerolessValue(value.getDate()) + " " +
                this.formatZerolessValue(value.getHours()) + ":" +
                this.formatZerolessValue(value.getMinutes()) + ":" +
                this.formatZerolessValue(value.getSeconds());
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
            return this.formatZerolessValue(value.getUTCFullYear()) + "-" +
                this.formatZerolessValue(value.getUTCMonth() + 1) + "-" +
                this.formatZerolessValue(value.getUTCDate()) + " " +
                this.formatZerolessValue(value.getUTCHours()) + ":" +
                this.formatZerolessValue(value.getUTCMinutes()) + ":" +
                this.formatZerolessValue(value.getUTCSeconds());
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

    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------

    /**
     * Formats given number to "0x" format, e.g. if it is 1 then it will return "01".
     */
    private static formatZerolessValue(value: number): string {
        if (value < 10)
            return "0" + value;

        return String(value);
    }

}
