import {EmbeddedOptions} from "./options/EmbeddedOptions";
import {getMetadataArgsStorage} from "../index";
import {EmbeddedMetadataArgs} from "../metadata-args/EmbeddedMetadataArgs";

/**
 * Embedded decorator is used to mark a specific class property as an embedded entity.
 * On persist all columns from the embedded are mapped to the single table of the entity where Embedded is used.
 * And on hydration all columns which supposed to be in the embedded will be mapped to it from the single table.
 */
export function Embedded(type: (type?: any) => Function, options?: EmbeddedOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        const reflectMetadataType = Reflect && (Reflect as any).getMetadata ? (Reflect as any).getMetadata("design:type", object, propertyName) : undefined;

        getMetadataArgsStorage().embeddeds.push({
            target: object.constructor,
            propertyName: propertyName,
            isArray: reflectMetadataType === Array || options && options.array === true,
            prefix: options && options.prefix !== undefined ? options.prefix : undefined,
            type: type
        } as EmbeddedMetadataArgs);
    };
}


