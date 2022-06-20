import { getMetadataArgsStorage } from "../../globals";
/**
 * Creates a "level"/"length" column to the table that holds a closure table.
 */
export function TreeLevelColumn() {
    return function (object, propertyName) {
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "treeLevel",
            options: {},
        });
    };
}

//# sourceMappingURL=TreeLevelColumn.js.map
