import { QueryRunner } from "../query-runner/QueryRunner"

/**
 * Configuration interface for table backup.
 */
export interface TableBackupConfig {
    /** Name of the table to be backed up. */
    tableName: string
    /** Array of primary key column names. */
    primaryKeyColumns: string[]
    /** Array of column names to be backed up. */
    backupColumns: string[]
}

/**
 * Utility class for safer migrations.
 * When using TypeORM for migrations that involve changing column types,
 * TypeORM first drops the column and recreates it after the migration.
 * This class provides methods to backup and restore data for such scenarios.
 */
export class SaferMigrations {
    /**
     * Starts the migration process by backing up data from specified tables and columns.
     * @param queryRunner - The QueryRunner instance for executing queries.
     * @param tableConfigs - An array of TableBackupConfig objects specifying the tables and columns to backup.
     */
    static async start(
        queryRunner: QueryRunner,
        tableConfigs: Array<TableBackupConfig>,
    ) {
        for (const config of tableConfigs) {
            await SaferMigrations.backupData(
                queryRunner,
                config.tableName,
                config.primaryKeyColumns,
                config.backupColumns,
            )
        }
    }

    /**
     * Finalizes the migration process by restoring data to specified tables and columns.
     * @param queryRunner - The QueryRunner instance for executing queries.
     * @param tableConfigs - An array of TableBackupConfig objects specifying the tables and columns to restore.
     */
    static async done(
        queryRunner: QueryRunner,
        tableConfigs: Array<TableBackupConfig>,
    ) {
        for (const config of tableConfigs) {
            await SaferMigrations.restoreData(
                queryRunner,
                config.tableName,
                config.primaryKeyColumns,
                config.backupColumns,
            )
        }
    }

    /**
     * Backs up data from a table.
     * @param queryRunner - The QueryRunner instance for executing queries.
     * @param tableName - The name of the table to back up.
     * @param primaryKeyColumns - The names of the primary key columns.
     * @param backupColumns - An array of column names to back up.
     */
    static async backupData(
        queryRunner: QueryRunner,
        tableName: string,
        primaryKeyColumns: string[],
        backupColumns: string[],
    ): Promise<void> {
        const backupTableName = `${tableName}_backup`

        // Drop the backup table if it exists
        await queryRunner.query(`DROP TABLE IF EXISTS ${backupTableName}`)

        // Create the backup table with the original types
        const columnsToBackup = [...primaryKeyColumns, ...backupColumns]
        const createTableQuery = `
      CREATE TABLE ${backupTableName} AS
      SELECT ${columnsToBackup.join(", ")} FROM ${tableName}
    `
        await queryRunner.query(createTableQuery)
    }

    /**
     * Restores data to a table from backups.
     * @param queryRunner - The QueryRunner instance for executing queries.
     * @param tableName - The name of the table to restore data to.
     * @param primaryKeyColumns - The names of the primary key columns.
     * @param backupColumns - An array of column names to restore.
     */
    static async restoreData(
        queryRunner: QueryRunner,
        tableName: string,
        primaryKeyColumns: string[],
        backupColumns: string[],
    ): Promise<void> {
        const backupTableName = `${tableName}_backup`

        for (const column of backupColumns) {
            // Read all data from the backup table
            const primaryKeysSelect = primaryKeyColumns.join(", ")
            const backupData = await queryRunner.query(
                `SELECT ${primaryKeysSelect}, ${column} FROM ${backupTableName}`,
            )

            // Check if there is any data in the backup table
            if (backupData.length === 0) {
                console.log(
                    `No data found in backup table ${backupTableName} for column '${column}'. Skipping restoration.`,
                )
                continue
            }

            // Update each row in the original table
            for (const row of backupData) {
                const updateConditions = primaryKeyColumns
                    .map((pk) => `${pk} = ?`)
                    .join(" AND ")
                const updateValues = primaryKeyColumns.map((pk) => row[pk])
                const updateQuery = `
          UPDATE ${tableName}
          SET ${column} = ?
          WHERE ${updateConditions}
        `
                await queryRunner.query(updateQuery, [
                    row[column],
                    ...updateValues,
                ])
            }
        }
        // Drop the backup table
        console.log(`Deleting backup table ${backupTableName}`)
        await queryRunner.query(`DROP TABLE IF EXISTS ${backupTableName}`)
    }
}
