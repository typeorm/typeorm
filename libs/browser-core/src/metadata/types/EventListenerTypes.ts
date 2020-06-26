/**
 * All types that entity listener can be.
 */
export type EventListenerType =
    "after-load"
    | "before-insert"
    | "after-insert"
    | "before-update"
    | "after-update"
    | "before-remove"
    | "after-remove";

/**
 * Provides a constants for each entity listener type.
 */
export class EventListenerTypes {
    static AFTER_LOAD: EventListenerType = "after-load";
    static BEFORE_INSERT: EventListenerType = "before-insert";
    static AFTER_INSERT: EventListenerType = "after-insert";
    static BEFORE_UPDATE: EventListenerType = "before-update";
    static AFTER_UPDATE: EventListenerType = "after-update";
    static BEFORE_REMOVE: EventListenerType = "before-remove";
    static AFTER_REMOVE: EventListenerType = "after-remove";
}
