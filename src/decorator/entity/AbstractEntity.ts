import {getMetadataArgsStorage} from "../../index";
import {TableMetadataArgs} from "../../metadata-args/TableMetadataArgs";

/**
 * Abstract entity is a class that contains columns and relations for all entities that will inherit this entity.
 * Database table for the abstract entity is not created.
 *
 * @deprecated don't use it anymore. Now entity can extend any class with columns, no need to mark it with this decorator
 */
export function AbstractEntity() {
    return function (target: Function) {
        const args: TableMetadataArgs = {
            target: target,
            name: undefined,
            type: "abstract"
        };
        getMetadataArgsStorage().tables.push(args);
    };
}