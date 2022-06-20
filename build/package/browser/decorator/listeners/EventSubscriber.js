import { getMetadataArgsStorage } from "../../globals";
/**
 * Classes decorated with this decorator will listen to ORM events and their methods will be triggered when event
 * occurs. Those classes must implement EventSubscriberInterface interface.
 */
export function EventSubscriber() {
    return function (target) {
        getMetadataArgsStorage().entitySubscribers.push({
            target: target,
        });
    };
}

//# sourceMappingURL=EventSubscriber.js.map
