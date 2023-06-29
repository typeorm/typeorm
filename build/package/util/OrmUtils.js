"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrmUtils = void 0;
class OrmUtils {
    // -------------------------------------------------------------------------
    // Public methods
    // -------------------------------------------------------------------------
    /**
     * Chunks array into peaces.
     */
    static chunk(array, size) {
        return Array.from(Array(Math.ceil(array.length / size)), (_, i) => {
            return array.slice(i * size, i * size + size);
        });
    }
    static splitClassesAndStrings(clsesAndStrings) {
        return [
            (clsesAndStrings).filter((cls) => typeof cls !== "string"),
            (clsesAndStrings).filter((str) => typeof str === "string"),
        ];
    }
    static groupBy(array, propertyCallback) {
        return array.reduce((groupedArray, value) => {
            const key = propertyCallback(value);
            let grouped = groupedArray.find(i => i.id === key);
            if (!grouped) {
                grouped = { id: key, items: [] };
                groupedArray.push(grouped);
            }
            grouped.items.push(value);
            return groupedArray;
        }, []);
    }
    static uniq(array, criteriaOrProperty) {
        return array.reduce((uniqueArray, item) => {
            let found = false;
            if (criteriaOrProperty instanceof Function) {
                const itemValue = criteriaOrProperty(item);
                found = !!uniqueArray.find(uniqueItem => criteriaOrProperty(uniqueItem) === itemValue);
            }
            else if (typeof criteriaOrProperty === "string") {
                found = !!uniqueArray.find(uniqueItem => uniqueItem[criteriaOrProperty] === item[criteriaOrProperty]);
            }
            else {
                found = uniqueArray.indexOf(item) !== -1;
            }
            if (!found)
                uniqueArray.push(item);
            return uniqueArray;
        }, []);
    }
    static isObject(item) {
        return (item && typeof item === "object" && !Array.isArray(item));
    }
    /**
     * Deep Object.assign.
     *
     * @see http://stackoverflow.com/a/34749873
     */
    static mergeDeep(target, ...sources) {
        if (!sources.length)
            return target;
        const source = sources.shift();
        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                const value = source[key];
                if (key === "__proto__" || value instanceof Promise)
                    continue;
                if (this.isObject(value)
                    && !(value instanceof Map)
                    && !(value instanceof Set)
                    && !(value instanceof Date)
                    && !(value instanceof Buffer)
                    && !(value instanceof RegExp)) {
                    if (!target[key])
                        Object.assign(target, { [key]: Object.create(Object.getPrototypeOf(value)) });
                    this.mergeDeep(target[key], value);
                }
                else {
                    Object.assign(target, { [key]: value });
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
    static deepCompare(...args) {
        let i, l, leftChain, rightChain;
        if (arguments.length < 1) {
            return true; // Die silently? Don't know how to handle such case, please help...
            // throw "Need two or more arguments to compare";
        }
        for (i = 1, l = arguments.length; i < l; i++) {
            leftChain = []; // Todo: this can be cached
            rightChain = [];
            if (!this.compare2Objects(leftChain, rightChain, arguments[0], arguments[i])) {
                return false;
            }
        }
        return true;
    }
    /**
     * Check if two entity-id-maps are the same
     */
    static compareIds(firstId, secondId) {
        if (firstId === undefined || firstId === null || secondId === undefined || secondId === null)
            return false;
        // Optimized version for the common case
        if (((typeof firstId.id === "string" && typeof secondId.id === "string") ||
            (typeof firstId.id === "number" && typeof secondId.id === "number")) &&
            Object.keys(firstId).length === 1 &&
            Object.keys(secondId).length === 1) {
            return firstId.id === secondId.id;
        }
        return OrmUtils.deepCompare(firstId, secondId);
    }
    /**
     * Transforms given value into boolean value.
     */
    static toBoolean(value) {
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
    static zipObject(keys, values) {
        return keys.reduce((object, column, index) => {
            object[column] = values[index];
            return object;
        }, {});
    }
    /**
     * Compares two arrays.
     */
    static isArraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length)
            return false;
        return arr1.every(element => {
            return arr2.indexOf(element) !== -1;
        });
    }
    // -------------------------------------------------------------------------
    // Private methods
    // -------------------------------------------------------------------------
    static compare2Objects(leftChain, rightChain, x, y) {
        let p;
        // remember that NaN === NaN returns false
        // and isNaN(undefined) returns true
        if (Number.isNaN(x) && Number.isNaN(y))
            return true;
        // Compare primitives and functions.
        // Check if both arguments link to the same object.
        // Especially useful on the step where we compare prototypes
        if (x === y)
            return true;
        // Unequal, but either is null or undefined (use case: jsonb comparasion)
        // PR #3776, todo: add tests
        if (x === null || y === null || x === undefined || y === undefined)
            return false;
        // Fix the buffer compare bug.
        // See: https://github.com/typeorm/typeorm/issues/3654
        if ((typeof x.equals === "function" || x.equals instanceof Function) && x.equals(y))
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
                    if (!this.compare2Objects(leftChain, rightChain, x[p], y[p])) {
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
}
exports.OrmUtils = OrmUtils;

//# sourceMappingURL=OrmUtils.js.map
