export type InterpretConditionAs = "is-null" | "exclude" | "throw"

export interface ConditionLoaderOptions {
    /**
     * How null values should be interpreted in WHERE conditions.
     * @default 'is-null'
     * @variation 'is-null' - null values will be interpreted as "IS NULL" in WHERE conditions.
     * @variation 'exclude' - null values will be excluded from WHERE conditions.
     * @variation 'throw' - null values will throw an error.
     */
    nullValues?: InterpretConditionAs

    /**
     * How undefined values should be interpreted in WHERE conditions.
     * @default 'exclude'
     * @variation 'is-null' - undefined values will be interpreted as "IS NULL" in WHERE conditions.
     * @variation 'exclude' - undefined values will be excluded from WHERE conditions
     * @variation 'throw' - undefined values will throw an error.
     */
    undefinedValues?: InterpretConditionAs
}
