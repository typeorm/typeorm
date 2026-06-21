    /**
     * Normalizes criteria based on the invalidWhereValuesBehavior configuration.
     * Handles `null` and `undefined` values in where conditions.
     *
     * By default (when no options are provided), both null and undefined values
     * will throw a TypeORMError.
     */
    static normalizeWhereCriteria(
        criteria: ObjectLiteral,
        options?: {
            null?: "ignore" | "sql-null" | "throw"
            undefined?: "ignore" | "throw"
        },
        path?: string,
    ): ObjectLiteral {
        // Apply default behavior (throw) when options are not provided
        const effectiveOptions = options ?? {
            null: "throw" as const,
            undefined: "throw" as const,
        }
