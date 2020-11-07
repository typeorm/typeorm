/**
 * Driver specific query clause generators
 */
export interface DriverQueryGenerators {
    /**
     * Generates the LIMIT ... OFFSET ... expression
     */
    limitOffsetExpression?(limit?: number, offset?: number): string | null;

    /**
     * Generates the FOR UPDATE and similar expressions
     */
    lockExpression?(lockMode: string, lockTables?: string[]): string | null;

    /**
     * Generates the WITH (...LOCK) expression
     */
    selectWithLockExpression?(lockMode?: string): string;
}
