import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";
import {getMetadataArgsStorage} from "../../index";

/**
 * This column will store an soft delete date of the deleted object.
 * This date is set when you delete the object, and set to null when you restore it
 */
export function SoftDeleteDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        if (!options) options = {} as ColumnOptions;
        options.nullable = true;

        const args: ColumnMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            mode: "softDeleteDate",
            options: options ? options : {}
        };
        getMetadataArgsStorage().columns.push(args);
    };
}
