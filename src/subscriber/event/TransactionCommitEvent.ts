import type { BaseEvent } from "./BaseEvent"

/**
 * TransactionCommitEvent is an object that broadcaster sends to the entity subscriber when an transaction is committed.
 */
export interface TransactionCommitEvent extends BaseEvent {}
