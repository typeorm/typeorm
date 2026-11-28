import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when an already-executed migration's generated SQL no longer matches
 * the checksum stored in the migrations table.
 */
export class MigrationChecksumMismatchError extends TypeORMError {
    readonly migrationName: string
    readonly storedChecksum: string
    readonly currentChecksum: string
    readonly currentSql: string

    constructor(
        migrationName: string,
        storedChecksum: string,
        currentChecksum: string,
        currentSql: string,
    ) {
        super(
            `Migration "${migrationName}" checksum mismatch (stored: ${storedChecksum}, current: ${currentChecksum}). This can mean the generated SQL changed, or that SQL was produced differently across environments. Compare the SQL used for the current checksum (bound parameters omitted):\n${currentSql}\nSet migrationsChecksumCheck to false to skip this check.`,
        )
        this.migrationName = migrationName
        this.storedChecksum = storedChecksum
        this.currentChecksum = currentChecksum
        this.currentSql = currentSql
    }
}
