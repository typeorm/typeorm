import { getMetadataArgsStorage } from "../../";
/**
 * ViewColumn decorator is used to mark a specific class property as a view column.
 */
export function ViewColumn(options) {
    return function (object, propertyName) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "regular",
            options: options || {}
        });
    };
}

//# sourceMappingURL=ViewColumn.js.map
