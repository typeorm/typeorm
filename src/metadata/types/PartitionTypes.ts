/**
 * Partition strategy types supported by various databases.
 *
 * - RANGE: Partition by value ranges (e.g., date ranges). Supported by PostgreSQL, MySQL, CockroachDB.
 * - LIST: Partition by discrete value lists (e.g., regions, categories). Supported by PostgreSQL, MySQL, CockroachDB.
 * - HASH: Partition by hash function for even distribution. Supported by PostgreSQL, MySQL, CockroachDB.
 */
export type PartitionType = "RANGE" | "LIST" | "HASH"
