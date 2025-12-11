import type { PartitionType } from "../../metadata/types/PartitionTypes"

/**
 * Partition configuration for a table.
 */
export interface PartitionByConfig {
    /**
     * Partition strategy: RANGE, LIST, or HASH.
     */
    type: PartitionType

    /**
     * Column names to partition by.
     * Can be a single column or multiple columns.
     *
     * Examples:
     * - ["logdate"] for simple column partitioning
     * - ["year", "month"] for composite partitioning
     *
     * Note: Either columns or expression must be specified, but not both.
     */
    columns?: string[]

    /**
     * Expression to partition by (alternative to columns).
     * Used for function-based partitioning.
     *
     * Examples:
     * - "YEAR(sale_date)" for MySQL
     * - "date_trunc('month', logdate)" for PostgreSQL
     *
     * Note: Either columns or expression must be specified, but not both.
     */
    expression?: string

    /**
     * Initial partitions to create (optional).
     * If not specified, partitions must be created manually or via migrations.
     *
     * Note: For MySQL RANGE and LIST partitioning, partitions are required in the CREATE TABLE statement.
     */
    partitions?: PartitionDefinition[]
}

/**
 * Individual partition definition.
 */
export interface PartitionDefinition {
    /**
     * Partition name (e.g., "p2023", "partition_north").
     */
    name: string

    /**
     * Partition bounds - format depends on partition type:
     *
     * RANGE (PostgreSQL/CockroachDB):
     *   values: ["2023-01-01", "2024-01-01"]  // FROM ... TO
     *   values: ["DEFAULT"]                    // Catch-all partition
     *
     * RANGE (MySQL):
     *   values: ["2024"]  // VALUES LESS THAN (upper bound)
     *
     * LIST:
     *   values: ["US", "CA", "MX"]  // List of values
     *
     * HASH (PostgreSQL/CockroachDB):
     *   values: ["4", "0"]  // [MODULUS, REMAINDER]
     *
     * HASH (MySQL):
     *   values: []  // Not needed, partition count specified in partitions array length
     */
    values: string[]

    /**
     * Tablespace (PostgreSQL-specific, optional).
     * Specifies the tablespace where the partition will be stored.
     */
    tablespace?: string
}
