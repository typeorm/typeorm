"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AfterRemove = void 0;
const __1 = require("../../");
const EventListenerTypes_1 = require("../../metadata/types/EventListenerTypes");
/**
 * Calls a method on which this decorator is applied after this entity removal.
 */
function AfterRemove() {
    return function (object, propertyName) {
        (0, __1.getMetadataArgsStorage)().entityListeners.push({
            target: object.constructor,
            propertyName: propertyName,
            type: EventListenerTypes_1.EventListenerTypes.AFTER_REMOVE
        });
    };
}
exports.AfterRemove = AfterRemove;
//# sourceMappingURL=AfterRemove.js.map