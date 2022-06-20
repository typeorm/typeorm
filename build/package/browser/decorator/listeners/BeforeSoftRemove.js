import { getMetadataArgsStorage } from "../../globals";
import { EventListenerTypes } from "../../metadata/types/EventListenerTypes";
/**
 * Calls a method on which this decorator is applied before this entity soft removal.
 */
export function BeforeSoftRemove() {
    return function (object, propertyName) {
        getMetadataArgsStorage().entityListeners.push({
            target: object.constructor,
            propertyName: propertyName,
            type: EventListenerTypes.BEFORE_SOFT_REMOVE,
        });
    };
}

//# sourceMappingURL=BeforeSoftRemove.js.map
