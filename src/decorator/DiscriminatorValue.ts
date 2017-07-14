import {getMetadataArgsStorage} from "../index";
import {DiscriminatorValueMetadataArgs} from "../metadata-args/DiscriminatorValueMetadataArgs";

/**
 * If entity is a child table of some table, it should have a discriminator value.
 * This decorator sets custom discriminator value for the entity.
 */
export function DiscriminatorValue(value: any): Function {
    return function (target: Function) {
        const args: DiscriminatorValueMetadataArgs = {
            target: target,
            value: value
        };
        getMetadataArgsStorage().discriminatorValues.push(args);
    };
}
