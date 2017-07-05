import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {EntityOptions} from "../options/EntityOptions";

/**
 * This decorator is used to mark classes that will be an entity (table or document depend on database type).
 * Database schema will be created for all classes decorated with it, and Repository can be retrieved and used for it.
 */
export function Entity(name?: string, options?: EntityOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "regular",
            orderBy: options && options.orderBy ? options.orderBy : undefined,
            engine: options && options.engine ? options.engine : undefined,
            skipSync: !!(options && options.skipSync === true)
        };
        getMetadataArgsStorage().tables.push(args);
    };
}
