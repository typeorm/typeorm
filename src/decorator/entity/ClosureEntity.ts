import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";
import {EntityOptions} from "../options/EntityOptions";

/**
 * Used on a entities that stores its children in a tree using closure design pattern.
 */
export function ClosureEntity(name?: string, options?: EntityOptions) {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: name,
            type: "closure",
            orderBy: options && options.orderBy ? options.orderBy : undefined,
            skipSync: !!(options && options.skipSync === true)
        };
        getMetadataArgsStorage().tables.push(args);
    };
}
