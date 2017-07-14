import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * Creates a "level"/"length" column to the table that holds a closure table.
 */
export function TreeLevelColumn(): Function {
    return function (object: Object, propertyName: string) {

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            mode: "treeLevel",
            options: {}
        };
        getMetadataArgsStorage().columns.push(args);
    };
}

