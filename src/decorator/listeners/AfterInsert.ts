import {getMetadataArgsStorage} from "../../index";
import {EventListenerTypes} from "../../metadata/types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../../metadata-args/EntityListenerMetadataArgs";

/**
 * Calls a method on which this decorator is applied after this entity insertion.
 */
export function AfterInsert() {
    return function (object: Object, propertyName: string) {

        const args: EntityListenerMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            type: EventListenerTypes.AFTER_INSERT
        };
        getMetadataArgsStorage().entityListeners.push(args);
    };
}