/**
 * Driver configuration options that affect how TypeORM performs certain actions such as query building.
 */
export interface DriverConfig {
    /**
     * The escape character for columns and aliases.
     */
    escapeCharacter?: string;

    /**
     * The maximum length that an alias can be (in queries).
     */
    maxAliasLength?: number;

    /**
     * Whether the driver supports multiple databases per connection.
     */
    multiDatabase?: true;

    /**
     * Whether the driver supports check constraints.
     */
    checkConstraints?: true;
    /**
     * Whether the driver supports exclusion constraints.
     */
    exclusionConstraints?: true;
    /**
     * Whether the driver supports unique constraints.
     */
    uniqueConstraints?: true;

    /**
     * Whether the driver can use DEFAULT as a value when inserting.
     */
    insertDefaultValue?: true;
    /**
     * Whether the driver accepts INSERT IGNORE as a modifier.
     */
    insertIgnoreModifier?: true;
    /**
     * Whether the driver requires an empty columns/values list if none are being inserted explicitly.
     *
     * Otherwise, INSERT DEFAULT VALUES is used.
     */
    insertEmptyColumnsValuesList?: true;

    /**
     * Whether the driver supports the SELECT DISTINCT ON ... clause.
     */
    distinctOnClause?: true;
    /**
     * Whether the driver supports the LIMIT clause on DELETE/UPDATE queries.
     */
    limitClauseOnModify?: true;
    /**
     * Whether the driver supports a RETURNING or OUTPUT clause
     */
    returningClause?: "returning" | "output";

    /**
     * Whether the driver has a dedicated ILIKE operator.
     */
    ilikeOperator?: true;
    /**
     * Whether the driver accepts the || concatenation operator.
     */
    concatOperator?: true;

    /**
     * Whether the driver supports native UUID generation.
     */
    uuidGeneration?: true;

    /**
     * Whether the driver supports the FULLTEXT index modifier.
     */
    fullTextIndexModifier?: boolean;
}
