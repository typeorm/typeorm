export type InvalidFindOptionsWhereBehavior = {
    /**
     * How to handle null values in where conditions.
     * - 'ignore': Skip null properties
     * - 'sql-null': Transform null to SQL NULL
     * - 'throw': Throw an error when null is encountered (default)
     */
    readonly null?: "ignore" | "sql-null" | "throw"

    /**
     * How to handle undefined values in where conditions.
     * - 'ignore': Skip undefined properties
     * - 'throw': Throw an error when undefined is encountered (default)
     */
    readonly undefined?: "ignore" | "throw"
}
