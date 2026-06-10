import type { DataSource } from "../../data-source/DataSource"
import { DriverPackageNotInstalledError, TypeORMError } from "../../error"
import type { QueryRunner } from "../../query-runner/QueryRunner"
import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import type { ExpoDataSourceOptions } from "./ExpoDataSourceOptions"
import { ExpoQueryRunner } from "./ExpoQueryRunner"

// Node raises `MODULE_NOT_FOUND` when the requested module can't be resolved,
// but the same code also fires for transitive failures (a dependency of
// `expo-sqlite` that's missing, a `require` inside the module body). Node's
// error message has the shape:
//
//   Cannot find module '<name>'
//   Require stack:
//   - /node_modules/<caller>/index.js
//   - ...
//
// The stack lists the calling modules and can include `expo-sqlite` when the
// unresolved module is a transitive dependency — so matching the whole
// message would misreport such failures as "install expo-sqlite". Only the
// first line identifies the actually-missing module, so match against that.
const isExpoSqliteNotFoundError = (err: unknown): boolean => {
    if (typeof err !== "object" || err === null) return false
    const e = err as { code?: string; message?: string }
    if (e.code !== "MODULE_NOT_FOUND") return false
    if (typeof e.message !== "string") return false
    const firstLine = e.message.split("\n", 1)[0]
    return firstLine.startsWith("Cannot find module 'expo-sqlite'")
}

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
                if (isExpoSqliteNotFoundError(err)) {
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
