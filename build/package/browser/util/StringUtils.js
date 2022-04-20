import shajs from "sha.js";
/**
 * Converts string into camelCase.
 *
 * @see http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 */
export function camelCase(str, firstCapital) {
    if (firstCapital === void 0) { firstCapital = false; }
    return str.replace(/^([A-Z])|[\s-_](\w)/g, function (match, p1, p2, offset) {
        if (firstCapital === true && offset === 0)
            return p1;
        if (p2)
            return p2.toUpperCase();
        return p1.toLowerCase();
    });
}
/**
 * Converts string into snake_case.
 *
 * @see https://regex101.com/r/QeSm2I/1
 */
export function snakeCase(str) {
    return str.replace(/(?:([a-z])([A-Z]))|(?:((?!^)[A-Z])([a-z]))/g, "$1_$3$2$4").toLowerCase();
}
/**
 * Converts string into Title Case.
 *
 * @see http://stackoverflow.com/questions/196972/convert-string-to-title-case-with-javascript
 */
export function titleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}
/**
 * Builds abbreviated string from given string;
 */
export function abbreviate(str, abbrLettersCount) {
    if (abbrLettersCount === void 0) { abbrLettersCount = 1; }
    var words = str.replace(/([a-z\xE0-\xFF])([A-Z\xC0\xDF])/g, "$1 $2").split(" ");
    return words.reduce(function (res, word) {
        res += word.substr(0, abbrLettersCount);
        return res;
    }, "");
}
/**
 * Shorten a given `input`. Useful for RDBMS imposing a limit on the
 * maximum length of aliases and column names in SQL queries.
 *
 * @param input String to be shortened.
 * @param options Default to `4` for segments length, `2` for terms length, `'__'` as a separator.
 *
 * @return Shortened `input`.
 *
 * @example
 * // returns: "UsShCa__orde__mark__dire"
 * shorten('UserShoppingCart__order__market__director')
 *
 * // returns: "cat_wit_ver_lon_nam_pos_wit_ver_lon_nam_pos_wit_ver_lon_nam"
 * shorten(
 *   'category_with_very_long_name_posts_with_very_long_name_post_with_very_long_name',
 *   { separator: '_', segmentLength: 3 }
 * )
 *
 * // equals: UsShCa__orde__mark_market_id
 * `${shorten('UserShoppingCart__order__market')}_market_id`
 */
export function shorten(input, options) {
    if (options === void 0) { options = {}; }
    var _a = options.segmentLength, segmentLength = _a === void 0 ? 4 : _a, _b = options.separator, separator = _b === void 0 ? "__" : _b, _c = options.termLength, termLength = _c === void 0 ? 2 : _c;
    var segments = input.split(separator);
    var shortSegments = segments.reduce(function (acc, val) {
        // split the given segment into many terms based on an eventual camel cased name
        var segmentTerms = val.replace(/([a-z\xE0-\xFF])([A-Z\xC0-\xDF])/g, "$1 $2").split(" ");
        // "OrderItemList" becomes "OrItLi", while "company" becomes "comp"
        var length = segmentTerms.length > 1 ? termLength : segmentLength;
        var shortSegment = segmentTerms.map(function (term) { return term.substr(0, length); }).join("");
        acc.push(shortSegment);
        return acc;
    }, []);
    return shortSegments.join(separator);
}
/**
 * Returns a hashed input.
 *
 * @param input String to be hashed.
 * @param options.length Optionally, shorten the output to desired length.
 */
export function hash(input, options) {
    if (options === void 0) { options = {}; }
    var hashFunction = shajs("sha256");
    hashFunction.update(input, "utf8");
    var hashedInput = hashFunction.digest("hex");
    if (options.length) {
        return hashedInput.slice(0, options.length);
    }
    return hashedInput;
}

//# sourceMappingURL=StringUtils.js.map
