import type { BaseEvent } from "./BaseEvent"

/**
 * TransactionRollbackEvent is an object that broadcaster sends to the entity subscriber on transaction rollback.
 */
export interface TransactionRollbackEvent extends BaseEvent {}
