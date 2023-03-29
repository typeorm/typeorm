import { getMetadataArgsStorage } from "../../";
/**
 * This column will store a number - version of the entity.
 * Every time your entity will be persisted, this number will be increased by one -
 * so you can organize visioning and update strategies of your entity.
 */
export function VersionColumn(options) {
    return function (object, propertyName) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "version",
            options: options || {}
        });
    };
}

//# sourceMappingURL=VersionColumn.js.map
