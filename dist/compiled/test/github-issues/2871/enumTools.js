"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Returns available values of an enum
 *
 * @example
 * ```
 *  enum LambdaEnum {
 *    NONE = 0,
 *    A = 1,
 *    B = 2,
 * }
 * // become => { "0": "NONE", "1": "A", "2": "B", "NONE": 0, "A": 1, "B": 2}
 *
 * const values = getEnumValues(LambdaEnum); // returns [ 0, 1, 2 ]
 * ```
 * @param enumObj
 * @returns The values of the enum
 */
function getEnumValues(enumObj) {
    return Object.keys(enumObj)
        .filter(function (key) { return isNaN(parseInt(key, 10)); })
        .map(function (key) { return enumObj[key]; });
}
exports.getEnumValues = getEnumValues;
//# sourceMappingURL=enumTools.js.map