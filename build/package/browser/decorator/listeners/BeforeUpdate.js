import { getMetadataArgsStorage } from "../../globals";
import { EventListenerTypes } from "../../metadata/types/EventListenerTypes";
/**
 * Calls a method on which this decorator is applied before this entity update.
 */
export function BeforeUpdate() {
    return function (object, propertyName) {
        getMetadataArgsStorage().entityListeners.push({
            target: object.constructor,
            propertyName: propertyName,
            type: EventListenerTypes.BEFORE_UPDATE,
        });
    };
}

//# sourceMappingURL=BeforeUpdate.js.map
