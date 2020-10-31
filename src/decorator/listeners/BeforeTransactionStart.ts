import {getMetadataArgsStorage} from "../../";
import {EventListenerTypes} from "../../metadata/types/EventListenerTypes";
import {EntityListenerMetadataArgs} from "../../metadata-args/EntityListenerMetadataArgs";

/**
 * Methods marked by this decorator are called right before transaction is started.
 * Methods are called for both find and persist operations.
 */
export function BeforeTransactionStart(): PropertyDecorator {
    return function (object: Object, propertyName: string) {

        getMetadataArgsStorage().entityListeners.push({
            target: object.constructor,
            propertyName: propertyName,
            type: EventListenerTypes.BEFORE_TRANSACTION_START
        } as EntityListenerMetadataArgs);
    };
}
