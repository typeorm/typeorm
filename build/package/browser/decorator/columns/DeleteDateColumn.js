import { getMetadataArgsStorage } from "../../globals";
/**
 * This column will store a delete date of the soft-deleted object.
 * This date is being updated each time you soft-delete the object.
 */
export function DeleteDateColumn(options) {
    return function (object, propertyName) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "deleteDate",
            options: options || {},
        });
    };
}

//# sourceMappingURL=DeleteDateColumn.js.map
