import type { DataSource } from "../../data-source/DataSource"
import { DriverPackageNotInstalledError, TypeORMError } from "../../error"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import type { ExpoDataSourceOptions } from "./ExpoDataSourceOptions"
import { ExpoQueryRunner } from "./ExpoQueryRunner"

// Node module-not-found errors carry the `MODULE_NOT_FOUND` code. Anything
// else — syntax errors, initialization throws — should bubble up unchanged
// so diagnostics aren't hidden behind a generic "package not installed"
// message.
const isModuleNotFoundError = (err: unknown): boolean =>
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "MODULE_NOT_FOUND"

export class ExpoDriver extends AbstractSqliteDriver {
    declare options: ExpoDataSourceOptions

    constructor(dataSource: DataSource) {
        super(dataSource)
        this.loadDependencies()
    }

    async disconnect(): Promise<void> {
        this.queryRunner = undefined
        await this.databaseConnection.closeAsync()
        this.databaseConnection = undefined
    }

    createQueryRunner(): QueryRunner {
        this.queryRunner ??= new ExpoQueryRunner(this)
        return this.queryRunner
    }

    protected async createDatabaseConnection() {
        this.databaseConnection = await this.sqlite.openDatabaseAsync(
            this.options.database,
        )
        await this.databaseConnection.runAsync("PRAGMA foreign_keys = ON")
        return this.databaseConnection
    }

    /**
     * Loads the `expo-sqlite` module when `options.driver` is not set. Extracted
     * as a method so tests can stub the module resolution without depending on
     * whether `expo-sqlite` happens to be installed in the workspace.
     *
     * A literal `require("expo-sqlite")` is used so Metro's static bundler picks
     * the dependency up at build time — `PlatformTools.load()` is a throwing
     * stub in the browser/React-Native build and cannot be used here.
     */
    protected requireExpoSqlite(): unknown {
        return require("expo-sqlite")
    }

    /**
     * If driver dependency is not given explicitly, resolve it via
     * `requireExpoSqlite()` and validate that the loaded module exposes the
     * modern async API introduced in Expo SDK v52.
     */
    protected loadDependencies(): void {
        if (this.options.driver) {
            this.sqlite = this.options.driver
        } else {
            try {
                this.sqlite = this.requireExpoSqlite()
            } catch (err) {
                if (isModuleNotFoundError(err)) {
                    throw new DriverPackageNotInstalledError(
                        "Expo SQLite",
                        "expo-sqlite",
                    )
                }
                throw err
            }
        }

        // Expo SDK v52 removed the legacy synchronous API. The modern async API
        // exposes `openDatabaseAsync` as a function — anything else (missing,
        // non-callable, non-object `driver`) means the user is on a pre-v52 SDK
        // or has passed something that isn't the expo-sqlite module.
        if (typeof this.sqlite?.openDatabaseAsync !== "function") {
            const hint = this.options.driver
                ? "check that the provided `driver` exposes `openDatabaseAsync` — custom overrides must match the expo-sqlite v52+ surface"
                : "upgrade to Expo SDK v52 or later, which ships the modern async SQLite API"
            throw new TypeORMError(
                `Legacy Expo SQLite driver is not supported — ${hint}.`,
            )
        }
    }
}
