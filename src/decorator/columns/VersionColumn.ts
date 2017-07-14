import {ColumnOptions} from "../options/ColumnOptions";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * This column will store a number - version of the entity.
 * Every time your entity will be persisted, this number will be increased by one -
 * so you can organize visioning and update strategies of your entity.
 */
export function VersionColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {

        // if column options are not given then create a new empty options
        if (!options) options = {} as ColumnOptions;

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            mode: "version",
            options: options
        };
        getMetadataArgsStorage().columns.push(args);
    };
}

