export type InterpretConditionAs = 'is-null' | 'exclude';

export interface ConditionLoaderOptions {
    /**
     * How null values should be interpreted in WHERE conditions.
     * @default 'is-null'
     * @variation 'is-null' - null values will be interpreted as "IS NULL" in WHERE conditions.
     * @variation 'exclude' - null values will be excluded from WHERE conditions.
     */
    nullValues?: InterpretConditionAs

    /**
     * How undefined values should be interpreted in WHERE conditions.
     * @default 'exclude'
     * @variation 'is-null' - undefined values will be interpreted as "IS NULL" in WHERE conditions.
     * @variation 'exclude' - undefined values will be excluded from WHERE conditions
     */
    undefinedValues?: InterpretConditionAs
}
