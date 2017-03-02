import {ObjectType} from "../common/ObjectType";
import {getMetadataArgsStorage} from "../index";
import {EmbeddedMetadataArgs} from "../metadata-args/EmbeddedMetadataArgs";

/**
 * Property in entity can be marked as Embedded, and on persist all columns from the embedded are mapped to the
 * single table of the entity where Embedded is used. And on hydration all columns which supposed to be in the
 * embedded will be mapped to it from the single table.
 */
export function Embedded<T>(typeFunction: (type?: any) => ObjectType<T>, options?: { prefix?: string, array?: boolean }) {
    return function (object: Object, propertyName: string) {

        const reflectMetadataType = Reflect && (Reflect as any).getMetadata ? (Reflect as any).getMetadata("design:type", object, propertyName) : undefined;
        const isArray = reflectMetadataType === Array || (options && options.array === true) ? true : false;

        const args: EmbeddedMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            isArray: isArray,
            prefix: options && options.prefix !== undefined ? options.prefix : undefined,
            type: typeFunction
        };
        getMetadataArgsStorage().embeddeds.add(args);
    };
}