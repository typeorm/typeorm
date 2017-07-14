import {ColumnOptions} from "../options/ColumnOptions";
import {ColumnType} from "../../driver/types/ColumnTypes";
import {getMetadataArgsStorage} from "../../index";
import {ColumnMetadataArgs} from "../../metadata-args/ColumnMetadataArgs";

/**
 * DiscriminatorColumn is a special type column used on entity class (not entity property)
 * and creates a special column which will contain an entity type.
 * This type is required for entities which use single table inheritance pattern.
 */
export function DiscriminatorColumn(discriminatorOptions: { name: string, type: ColumnType }): Function {
    return function (target: Function) {

        // if column options are not given then create a new empty options
        const options: ColumnOptions = {
            name: discriminatorOptions.name,
            type: discriminatorOptions.type
        };

        // create and register a new column metadata
        const args: ColumnMetadataArgs = {
            target: target,
            mode: "discriminator",
            propertyName: discriminatorOptions.name,
            options: options
        };
        getMetadataArgsStorage().columns.push(args);
    };
}

