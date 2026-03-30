import type { BaseEvent } from "./BaseEvent"

/**
 * BeforeQueryEvent is an object that broadcaster sends to the entity subscriber before query is ran against the database.
 */
export interface QueryEvent extends BaseEvent {
    /**
     * Query that is being executed.
     */
    query: string

    /**
     * Parameters used in the query.
     */
    parameters?: any[]
}

export interface BeforeQueryEvent extends QueryEvent {}

export interface AfterQueryEvent extends QueryEvent {
    /**
     * Whether the query was successful.
     */
    success: boolean

    /**
     * The duration of the query execution, in milliseconds.
     */
    executionTime?: number

    /**
     * The raw results from the database if the query was successful.
     */
    rawResults?: any

    /**
     * The error thrown if the query was unsuccessful.
     */
    error?: any
}
