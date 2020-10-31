/**
 * All types that entity listener can be.
 */
export type EventListenerType =
    | "after-load"
    | "before-insert"
    | "after-insert"
    | "before-update"
    | "after-update"
    | "before-remove"
    | "after-remove"
    | "before-transaction-start"
    | "after-transaction-start"
    | "before-commit"
    | "after-commit";

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
    static BEFORE_TRANSACTION_START: EventListenerType = "before-transaction-start";
    static AFTER_TRANSACTION_START: EventListenerType = "after-transaction-start";
    static BEFORE_COMMIT: EventListenerType = "before-commit";
    static AFTER_COMMIT: EventListenerType = "after-commit";
}
