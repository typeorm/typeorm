import { getMetadataArgsStorage } from "../../";
/**
 * Special type of column that is available only for MongoDB database.
 * Marks your entity's column to be an object id.
 */
export function ObjectIdColumn(options) {
    return function (object, propertyName) {
        // if column options are not given then create a new empty options
        if (!options)
            options = {};
        options.primary = true;
        if (!options.name)
            options.name = "_id";
        // create and register a new column metadata
        getMetadataArgsStorage().columns.push({
            target: object.constructor,
            propertyName: propertyName,
            mode: "objectId",
            options: options
        });
    };
}

//# sourceMappingURL=ObjectIdColumn.js.map
