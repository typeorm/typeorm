/**
 * Converts string into camelCase.
 *
 * @see http://stackoverflow.com/questions/2970525/converting-any-string-into-camel-case
 */
export function camelCase(str: string) {
    return str.replace(/^([A-Z])|[\s-_](\w)/g, function(match, p1, p2, offset) {
        if (p2) return p2.toUpperCase();
        return p1.toLowerCase();
    });
}

/**
 * Converts string into snake-case.
 *
 * @see http://stackoverflow.com/questions/30521224/javascript-convert-pascalcase-to-underscore-case
 */
export function snakeCase(str: string) {
    return str.replace(/(?:^|\.?)([A-Z])/g, (x, y) => "_" + y.toLowerCase()).replace(/^_/, "");
}

/**
 * Pads a string to a certain length with another string
 */
export function strPad(str: any, length: number, char: string = "0"): string {
    if (typeof str !== "string") {
        str = str + "";
    }
    while (str.length < length)
        str = char + str;
    return str;
}