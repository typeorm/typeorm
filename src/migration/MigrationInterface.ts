import { QueryRunner } from "../query-runner/QueryRunner"

/**
 * Migrations should implement this interface and all its methods.
 */
export interface MigrationInterface {
    /**
     * Optional migration name, defaults to class name.
     */
    name?: string

    /**
     * Optional flag to determine whether to run the migration in a transaction or not.
     * Can only be used when `migrationsTransactionMode` is "each" or "none".
     * When `migrationsTransactionMode` is "all", setting this to `false` is allowed
     * and will cause the migration to run outside the main transaction.
     * This is useful for operations like concurrent index creation that cannot run in transactions.
     * Defaults to `true` when `migrationsTransactionMode` is "each"
     * Defaults to `false` when `migrationsTransactionMode` is "none"
     */
    transaction?: boolean

    /**
     * Run the migrations.
     */
    up(queryRunner: QueryRunner): Promise<any>

    /**
     * Reverse the migrations.
     */
    down(queryRunner: QueryRunner): Promise<any>
}
