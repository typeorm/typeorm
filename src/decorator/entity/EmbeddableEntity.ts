import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * This decorator is used on the entities that must be embedded into another entities.
 *
 * @deprecated don't use it anymore. Now entity can embed any class with columns, no need to mark it with this decorator
 */
export function EmbeddableEntity(): Function {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            type: "embeddable",
            orderBy: undefined
        };
        getMetadataArgsStorage().tables.push(args);
    };
}
