import {ColumnOptions} from "../options/ColumnOptions";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * Special type of column that is available only for MongoDB database.
 * Marks your entity's column to be an object id.
 */
export function ObjectIdColumn<T>(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;
        options = Object.assign(options, {
            primary: true,
            name: options.name ? options.name : "_id"
        });

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            mode: "objectId",
            options: options
        };
        getMetadataArgsStorage().columns.add(args);
    };
}
