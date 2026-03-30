import type { BaseEvent } from "./BaseEvent"

/**
 * TransactionStartEvent is an object that broadcaster sends to the entity subscriber before transaction is started.
 */
export interface TransactionStartEvent extends BaseEvent {}
