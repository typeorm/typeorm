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
    | "after-remove";

/**
 * Provides a constants for each entity listener type.
 */
export class EventListenerTypes {
    static AFTER_LOAD = "after-load" as const;
    static BEFORE_INSERT = "before-insert" as const;
    static AFTER_INSERT = "after-insert" as const;
    static BEFORE_UPDATE = "before-update" as const;
    static AFTER_UPDATE = "after-update" as const;
    static BEFORE_REMOVE = "before-remove" as const;
    static AFTER_REMOVE = "after-remove" as const;
}
