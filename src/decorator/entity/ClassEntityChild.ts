import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {EntityOptions} from "../options/EntityOptions";

/**
 * Special type of the entity used in the class-table inherited tables.
 */
export function ClassEntityChild(tableName?: string, options?: EntityOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: tableName,
            type: "class-table-child",
            orderBy: options && options.orderBy ? options.orderBy : undefined,
            skipSync: !!(options && options.skipSync === true)
        };
        getMetadataArgsStorage().tables.push(args);
    };
}