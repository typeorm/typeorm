import {ColumnOptions} from "../options/ColumnOptions";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * This column will store an soft delete date of the deleted object.
 * This date is set when you delete the object, and set to null when you restore it
 */
export function SoftDeleteDateColumn(options?: ColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options ? options : {};
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

