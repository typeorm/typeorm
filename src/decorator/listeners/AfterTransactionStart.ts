import {getMetadataArgsStorage} from "../../";
import {EventListenerTypes} from "../../metadata/types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../../metadata-args/EntityListenerMetadataArgs";

/**
 * Methods marked by this decorator are called right after transaction is started.
 * Methods are called for both find and persist operations.
 */
export function AfterTransactionStart(): PropertyDecorator {
    return function (object: Object, propertyName: string) {

        getMetadataArgsStorage().entityListeners.push({
            target: object.constructor,
            propertyName: propertyName,
            type: EventListenerTypes.AFTER_TRANSACTION_START
        } as EntityListenerMetadataArgs);
    };
}
