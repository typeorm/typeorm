/*
MIT License

Copyright (c) 2021 Sasha Koss and Lesha Koss https://kossnocorp.mit-license.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// This code has been taken from date-fns:
// https://github.com/date-fns/date-fns/blob/7e8026159b9496eddc3a683895d2e0566715d4bb/src/parseISO/index.ts

/**
 * Milliseconds in 1 minute
 *
 * @name millisecondsInMinute
 * @constant
 * @type {number}
 * @default
 */
export const millisecondsInMinute = 60000

/**
 * Milliseconds in 1 hour
 *
 * @name millisecondsInHour
 * @constant
 * @type {number}
 * @default
 */
export const millisecondsInHour = 3600000

/**
 * The {@link parseISO} function options.
 */
export interface ParseISOOptions {
    additionalDigits?: 0 | 1 | 2
}

/**
 * @name parseISO
 * @category Common Helpers
 * @summary Parse ISO string
 *
 * @description
 * Parse the given string in ISO 8601 format and return an instance of Date.
 *
 * Function accepts complete ISO 8601 formats as well as partial implementations.
 * ISO 8601: http://en.wikipedia.org/wiki/ISO_8601
 *
 * If the argument isn't a string, the function cannot parse the string or
 * the values are invalid, it returns Invalid Date.
 *
 * @param argument - the value to convert
 * @param options - an object with options.
 * @returns the parsed date in the local time zone
 *
 * @example
 * // Convert string '2014-02-11T11:30:30' to date:
 * const result = parseISO('2014-02-11T11:30:30')
 * //=> Tue Feb 11 2014 11:30:30
 *
 * @example
 * // Convert string '+02014101' to date,
 * // if the additional number of digits in the extended year format is 1:
 * const result = parseISO('+02014101', { additionalDigits: 1 })
 * //=> Fri Apr 11 2014 00:00:00
 */
export default function parseISO(
    argument: string,
    options?: ParseISOOptions,
): Date {
    const additionalDigits = options?.additionalDigits ?? 2
    const dateStrings = splitDateString(argument)

    let date
    if (dateStrings.date) {
        const parseYearResult = parseYear(dateStrings.date, additionalDigits)
        date = parseDate(parseYearResult.restDateString, parseYearResult.year)
    }

    if (!date || isNaN(date.getTime())) {
        return new Date(NaN)
    }

    const timestamp = date.getTime()
    let time = 0
    let offset

    if (dateStrings.time) {
        time = parseTime(dateStrings.time)
        if (isNaN(time)) {
            return new Date(NaN)
        }
    }

    if (dateStrings.timezone) {
        offset = parseTimezone(dateStrings.timezone)
        if (isNaN(offset)) {
            return new Date(NaN)
        }
    } else {
        const dirtyDate = new Date(timestamp + time)
        // js parsed string assuming it's in UTC timezone
        // but we need it to be parsed in our timezone
        // so we use utc values to build date in our timezone.
        // Year values from 0 to 99 map to the years 1900 to 1999
        // so set year explicitly with setFullYear.
        const result = new Date(0)
        result.setFullYear(
            dirtyDate.getUTCFullYear(),
            dirtyDate.getUTCMonth(),
            dirtyDate.getUTCDate(),
        )
        result.setHours(
            dirtyDate.getUTCHours(),
            dirtyDate.getUTCMinutes(),
            dirtyDate.getUTCSeconds(),
            dirtyDate.getUTCMilliseconds(),
        )
        return result
    }

    return new Date(timestamp + time + offset)
}

interface DateString {
    date?: string
    time?: string
    timezone?: string
}

interface ParsedYear {
    year: number
    restDateString: string
}

const patterns = {
    dateTimeDelimiter: /[T ]/,
    timeZoneDelimiter: /[Z ]/i,
    timezone: /([Z+-].*)$/,
}

const dateRegex =
    /^-?(?:(\d{3})|(\d{2})(?:-?(\d{2}))?|W(\d{2})(?:-?(\d{1}))?|)$/
const timeRegex =
    /^(\d{2}(?:[.,]\d*)?)(?::?(\d{2}(?:[.,]\d*)?))?(?::?(\d{2}(?:[.,]\d*)?))?$/
const timezoneRegex = /^([+-])(\d{2})(?::?(\d{2}))?$/

function splitDateString(dateString: string): DateString {
    const dateStrings: DateString = {}
    const array = dateString.split(patterns.dateTimeDelimiter)
    let timeString

    // The regex match should only return at maximum two array elements.
    // [date], [time], or [date, time].
    if (array.length > 2) {
        return dateStrings
    }

    if (/:/.test(array[0])) {
        timeString = array[0]
    } else {
        dateStrings.date = array[0]
        timeString = array[1]
        if (patterns.timeZoneDelimiter.test(dateStrings.date)) {
            dateStrings.date = dateString.split(patterns.timeZoneDelimiter)[0]
            timeString = dateString.substr(
                dateStrings.date.length,
                dateString.length,
            )
        }
    }

    if (timeString) {
        const token = patterns.timezone.exec(timeString)
        if (token) {
            dateStrings.time = timeString.replace(token[1], "")
            dateStrings.timezone = token[1]
        } else {
            dateStrings.time = timeString
        }
    }

    return dateStrings
}

function parseYear(dateString: string, additionalDigits: number): ParsedYear {
    const regex = new RegExp(
        "^(?:(\\d{4}|[+-]\\d{" +
            (4 + additionalDigits) +
            "})|(\\d{2}|[+-]\\d{" +
            (2 + additionalDigits) +
            "})$)",
    )

    const captures = dateString.match(regex)
    // Invalid ISO-formatted year
    if (!captures) return { year: NaN, restDateString: "" }

    const year = captures[1] ? parseInt(captures[1]) : null
    const century = captures[2] ? parseInt(captures[2]) : null

    // either year or century is null, not both
    return {
        year: century === null ? (year as number) : century * 100,
        restDateString: dateString.slice((captures[1] || captures[2]).length),
    }
}

function parseDate(dateString: string, year: number): Date {
    // Invalid ISO-formatted year
    if (year === null) return new Date(NaN)

    const captures = dateString.match(dateRegex)
    // Invalid ISO-formatted string
    if (!captures) return new Date(NaN)

    const isWeekDate = !!captures[4]
    const dayOfYear = parseDateUnit(captures[1])
    const month = parseDateUnit(captures[2]) - 1
    const day = parseDateUnit(captures[3])
    const week = parseDateUnit(captures[4])
    const dayOfWeek = parseDateUnit(captures[5]) - 1

    if (isWeekDate) {
        if (!validateWeekDate(year, week, dayOfWeek)) {
            return new Date(NaN)
        }
        return dayOfISOWeekYear(year, week, dayOfWeek)
    } else {
        const date = new Date(0)
        if (
            !validateDate(year, month, day) ||
            !validateDayOfYearDate(year, dayOfYear)
        ) {
            return new Date(NaN)
        }
        date.setUTCFullYear(year, month, Math.max(dayOfYear, day))
        return date
    }
}

function parseDateUnit(value: string): number {
    return value ? parseInt(value) : 1
}

function parseTime(timeString: string): number {
    const captures = timeString.match(timeRegex)
    if (!captures) return NaN // Invalid ISO-formatted time

    const hours = parseTimeUnit(captures[1])
    const minutes = parseTimeUnit(captures[2])
    const seconds = parseTimeUnit(captures[3])

    if (!validateTime(hours, minutes, seconds)) {
        return NaN
    }

    return (
        hours * millisecondsInHour +
        minutes * millisecondsInMinute +
        seconds * 1000
    )
}

function parseTimeUnit(value: string): number {
    return (value && parseFloat(value.replace(",", "."))) || 0
}

function parseTimezone(timezoneString: string): number {
    if (timezoneString === "Z") return 0

    const captures = timezoneString.match(timezoneRegex)
    if (!captures) return 0

    const sign = captures[1] === "+" ? -1 : 1
    const hours = parseInt(captures[2])
    const minutes = (captures[3] && parseInt(captures[3])) || 0

    if (!validateTimezone(hours, minutes)) {
        return NaN
    }

    return sign * (hours * millisecondsInHour + minutes * millisecondsInMinute)
}

function dayOfISOWeekYear(
    isoWeekYear: number,
    week: number,
    day: number,
): Date {
    const date = new Date(0)
    date.setUTCFullYear(isoWeekYear, 0, 4)
    const fourthOfJanuaryDay = date.getUTCDay() || 7
    const diff = (week - 1) * 7 + day + 1 - fourthOfJanuaryDay
    date.setUTCDate(date.getUTCDate() + diff)
    return date
}

// Validation functions

// February is null to handle the leap year (using ||)
const daysInMonths = [31, null, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYearIndex(year: number): boolean {
    return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0)
}

function validateDate(year: number, month: number, date: number): boolean {
    return (
        month >= 0 &&
        month <= 11 &&
        date >= 1 &&
        date <= (daysInMonths[month] || (isLeapYearIndex(year) ? 29 : 28))
    )
}

function validateDayOfYearDate(year: number, dayOfYear: number): boolean {
    return dayOfYear >= 1 && dayOfYear <= (isLeapYearIndex(year) ? 366 : 365)
}

function validateWeekDate(_year: number, week: number, day: number): boolean {
    return week >= 1 && week <= 53 && day >= 0 && day <= 6
}

function validateTime(
    hours: number,
    minutes: number,
    seconds: number,
): boolean {
    if (hours === 24) {
        return minutes === 0 && seconds === 0
    }

    return (
        seconds >= 0 &&
        seconds < 60 &&
        minutes >= 0 &&
        minutes < 60 &&
        hours >= 0 &&
        hours < 25
    )
}

function validateTimezone(_hours: number, minutes: number): boolean {
    return minutes >= 0 && minutes <= 59
}
