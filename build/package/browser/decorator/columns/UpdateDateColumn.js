import { getMetadataArgsStorage } from "../../globals";
/**
 * This column will store an update date of the updated object.
 * This date is being updated each time you persist the object.
 */
export function UpdateDateColumn(options) {
    return function (object, propertyName) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "updateDate",
            options: options ? options : {},
        });
    };
}

//# sourceMappingURL=UpdateDateColumn.js.map
