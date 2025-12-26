import { Table } from "../../schema-builder/table/Table"
import { PartitionDefinition } from "../../decorator/options/PartitionOptions"
import { PartitionType } from "../../metadata/types/PartitionTypes"
import { TypeORMError } from "../../error"
import type { BaseQueryRunner } from "../../query-runner/BaseQueryRunner"

/**
 * Utility functions for PostgreSQL-compatible partition operations.
 * Used by both PostgreSQL and CockroachDB drivers.
 */
export class PostgresPartitionUtils {
    /**
     * Builds PostgreSQL-compatible PARTITION BY clause.
     */
    static buildPartitionClauseSql(table: Table): string {
        if (!table.partition) return ""

        const partition = table.partition
        let sql = ` PARTITION BY ${partition.type}`

        // Partition key (columns or expression)
        if (partition.expression) {
            sql += ` (${partition.expression})`
        } else if (partition.columns) {
            const columns = partition.columns
                .map((col) => `"${col}"`)
                .join(", ")
            sql += ` (${columns})`
        } else {
            throw new TypeORMError(
                "Partition configuration must specify either 'columns' or 'expression'",
            )
        }

        return sql
    }

    /**
     * Builds the partition values clause for CREATE TABLE ... PARTITION OF.
     */
    static buildPartitionValuesClause(
        partition: PartitionDefinition,
        partitionType: PartitionType,
    ): string {
        if (partitionType === "RANGE") {
            if (
                partition.values.length === 1 &&
                (partition.values[0] === "MAXVALUE" ||
                    partition.values[0] === "DEFAULT")
            ) {
                return ` DEFAULT`
            } else if (partition.values.length === 2) {
                // Escape single quotes in partition values to prevent SQL injection
                const from = partition.values[0].replace(/'/g, "''")
                const to = partition.values[1].replace(/'/g, "''")
                return ` FOR VALUES FROM ('${from}') TO ('${to}')`
            } else {
                throw new TypeORMError(
                    "RANGE partition requires 2 values [from, to] or ['MAXVALUE'] / ['DEFAULT']",
                )
            }
        } else if (partitionType === "LIST") {
            if (partition.values.length === 0) {
                throw new TypeORMError(
                    "LIST partition requires at least one value",
                )
            }
            // Escape single quotes in each value to prevent SQL injection
            const values = partition.values
                .map((v) => `'${v.replace(/'/g, "''")}'`)
                .join(", ")
            return ` FOR VALUES IN (${values})`
        } else if (partitionType === "HASH") {
            if (partition.values.length === 2) {
                // Validate that modulus and remainder are integers to prevent injection
                const modulus = parseInt(partition.values[0], 10)
                const remainder = parseInt(partition.values[1], 10)
                if (
                    isNaN(modulus) ||
                    isNaN(remainder) ||
                    modulus <= 0 ||
                    remainder < 0 ||
                    remainder >= modulus ||
                    modulus > 1024
                ) {
                    throw new TypeORMError(
                        "HASH partition requires valid integers: modulus (1-1024), remainder (0 to modulus-1)",
                    )
                }
                return ` FOR VALUES WITH (MODULUS ${modulus}, REMAINDER ${remainder})`
            } else {
                throw new TypeORMError(
                    "HASH partition requires 2 values [modulus, remainder]",
                )
            }
        }

        return ""
    }

    /**
     * Creates a partition of a partitioned table.
     */
    static async createPartition(
        queryRunner: BaseQueryRunner,
        tableName: string,
        partition: PartitionDefinition,
        partitionType: PartitionType,
        options: {
            escapePath: (target: string) => string
            includeTablespace?: boolean
            escapeIdentifier?: (name: string) => string
        },
    ): Promise<void> {
        let sql = `CREATE TABLE ${options.escapePath(
            partition.name,
        )} PARTITION OF ${options.escapePath(tableName)}`

        sql += this.buildPartitionValuesClause(partition, partitionType)

        if (options.includeTablespace && partition.tablespace) {
            // Use provided escape function or default
            const escape = options.escapeIdentifier || ((name) => `"${name}"`)
            sql += ` TABLESPACE ${escape(partition.tablespace)}`
        }

        await queryRunner.query(sql)
    }

    /**
     * Drops a partition from a partitioned table.
     */
    static async dropPartition(
        queryRunner: BaseQueryRunner,
        partitionName: string,
        escapePath: (target: string) => string,
    ): Promise<void> {
        const sql = `DROP TABLE ${escapePath(partitionName)}`
        await queryRunner.query(sql)
    }

    /**
     * Lists all partitions of a table using pg_inherits.
     */
    static async getPartitions(
        queryRunner: BaseQueryRunner,
        tableName: string,
    ): Promise<string[]> {
        const driver = (queryRunner as any).driver
        const parsedTableName = driver.parseTableName(tableName)
        const schema =
            parsedTableName.schema ||
            (await (queryRunner as any).getCurrentSchema())
        const name = parsedTableName.tableName

        const sql = `
            SELECT
                child.relname AS partition_name
            FROM pg_inherits
            JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
            JOIN pg_class child ON pg_inherits.inhrelid = child.oid
            JOIN pg_namespace nmsp_parent ON nmsp_parent.oid = parent.relnamespace
            WHERE parent.relname = $1
              AND nmsp_parent.nspname = $2
        `

        const results = await queryRunner.query(sql, [name, schema])
        return results.map((row: any) => row.partition_name)
    }
}
