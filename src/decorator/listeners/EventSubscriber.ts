import {getMetadataArgsStorage} from "../../index";
import {EntitySubscriberMetadataArgs} from "../../metadata-args/EntitySubscriberMetadataArgs";

/**
 * Classes decorated with this decorator will listen to ORM events and their methods will be triggered when event
 * occurs. Those classes must implement EventSubscriberInterface interface.
 */
export function EventSubscriber() {
    return function (target: Function) {
        const args: EntitySubscriberMetadataArgs = {
            target: target
        };
        getMetadataArgsStorage().entitySubscribers.push(args);
    };
}