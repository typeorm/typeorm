/**
 * All types that entity listener can be.
 */
export declare type EventListenerType = "after-load" | "before-insert" | "after-insert" | "before-update" | "after-update" | "before-remove" | "after-remove";
/**
 * Provides a constants for each entity listener type.
 */
export declare class EventListenerTypes {
    static AFTER_LOAD: EventListenerType;
    static BEFORE_INSERT: EventListenerType;
    static AFTER_INSERT: EventListenerType;
    static BEFORE_UPDATE: EventListenerType;
    static AFTER_UPDATE: EventListenerType;
    static BEFORE_REMOVE: EventListenerType;
    static AFTER_REMOVE: EventListenerType;
}
