import {ObjectLiteral} from "../common/ObjectLiteral";

export class OrmUtils {

    static splitClassesAndStrings<T>(clsesAndStrings: T[]|string[]): [T[], string[]] {
        return [
            (clsesAndStrings as T[]).filter(cls => typeof cls !== "string"),
            (clsesAndStrings as string[]).filter(str => typeof str === "string"),
        ];
    }

    static groupBy<T, R>(array: T[], propertyCallback: (item: T) => R): { id: R, items: T[] }[] {
        return array.reduce((groupedArray, value) => {
            const key = propertyCallback(value);
            let grouped = groupedArray.find(i => i.id === key);
            if (!grouped) {
                grouped = { id: key, items: [] };
                groupedArray.push(grouped);
            }
            grouped.items.push(value);
            return groupedArray;
        }, [] as Array<{ id: R, items: T[] }>);
    }

    static isObject(item: any) {
        return (item && typeof item === "object" && !Array.isArray(item));
    }

    /**
     * Deep Object.assign.
     *
     * @see http://stackoverflow.com/a/34749873
     */
    static mergeDeep(target: any, ...sources: any[]): any {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.mergeDeep(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return this.mergeDeep(target, ...sources);
    }

    /**
     * Deep compare objects.
     *
     * @see http://stackoverflow.com/a/1144249
     */
    static deepCompare(...args: any[]) {
        let i: any, l: any, leftChain: any, rightChain: any;

        function compare2Objects(x: any, y: any) {
            let p;

            // remember that NaN === NaN returns false
            // and isNaN(undefined) returns true
            if (isNaN(x) && isNaN(y) && typeof x === "number" && typeof y === "number")
                return true;

            // Compare primitives and functions.
            // Check if both arguments link to the same object.
            // Especially useful on the step where we compare prototypes
            if (x === y)
                return true;

            if (x.equals instanceof Function && x.equals(y))
                return true;

            // Works in case when functions are created in constructor.
            // Comparing dates is a common scenario. Another built-ins?
            // We can even handle functions passed across iframes
            if ((typeof x === "function" && typeof y === "function") ||
                (x instanceof Date && y instanceof Date) ||
                (x instanceof RegExp && y instanceof RegExp) ||
                (x instanceof String && y instanceof String) ||
                (x instanceof Number && y instanceof Number))
                return x.toString() === y.toString();

            // At last checking prototypes as good as we can
            if (!(x instanceof Object && y instanceof Object))
                return false;

            if (x.isPrototypeOf(y) || y.isPrototypeOf(x))
                return false;

            if (x.constructor !== y.constructor)
                return false;

            if (x.prototype !== y.prototype)
                return false;

            // Check for infinitive linking loops
            if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1)
                return false;

            // Quick checking of one object being a subset of another.
            // todo: cache the structure of arguments[0] for performance
            for (p in y) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }
            }

            for (p in x) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }

                switch (typeof (x[p])) {
                    case "object":
                    case "function":

                        leftChain.push(x);
                        rightChain.push(y);

                        if (!compare2Objects (x[p], y[p])) {
                            return false;
                        }

                        leftChain.pop();
                        rightChain.pop();
                        break;

                    default:
                        if (x[p] !== y[p]) {
                            return false;
                        }
                        break;
                }
            }

            return true;
        }

        if (arguments.length < 1) {
            return true; // Die silently? Don't know how to handle such case, please help...
            // throw "Need two or more arguments to compare";
        }

        for (i = 1, l = arguments.length; i < l; i++) {

            leftChain = []; // Todo: this can be cached
            rightChain = [];

            if (!compare2Objects(arguments[0], arguments[i])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Transforms given value into boolean value.
     */
    static toBoolean(value: any): boolean {
        if (typeof value === "boolean")
            return value;

        if (typeof value === "string")
            return value === "true" || value === "1";

        if (typeof value === "number")
            return value > 0;

        return false;
    }

    /**
     * Composes an object from the given array of keys and values.
     */
    static zipObject(keys: any[], values: any[]): ObjectLiteral {
        return keys.reduce((object, column, index) => {
            object[column] = values[index];
            return object;
        }, {} as ObjectLiteral);
    }

}