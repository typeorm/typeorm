import type { IsolationLevel } from "../../driver/types/IsolationLevel"

export interface TransactionOptions {
    connectionName?: string
    isolation?: IsolationLevel
}
