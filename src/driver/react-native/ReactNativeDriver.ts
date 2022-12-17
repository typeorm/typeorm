import { AbstractSqliteDriver } from "../sqlite-abstract/AbstractSqliteDriver"
import { ReactNativeConnectionOptions } from "./ReactNativeConnectionOptions"
import { ReactNativeQueryRunner } from "./ReactNativeQueryRunner"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { DataSource } from "../../data-source/DataSource"
import { DriverPackageNotInstalledError } from "../../error/DriverPackageNotInstalledError"
import { ReplicationMode } from "../types/ReplicationMode"

export class ReactNativeDriver extends AbstractSqliteDriver {
    options: ReactNativeConnectionOptions

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: DataSource) {
        super(connection)

        this.database = this.options.database

        // load sqlite package
        this.loadDependencies()
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Closes connection with database.
     */
    async disconnect(): Promise<void> {
        return new Promise<void>((ok, fail) => {
            this.queryRunner = undefined
            this.databaseConnection.close(ok, fail)
        })
    }

    /**
     * Creates a query runner used to execute database queries.
     */
    createQueryRunner(mode: ReplicationMode): QueryRunner {
        if (!this.queryRunner)
            this.queryRunner = new ReactNativeQueryRunner(this)

        return this.queryRunner
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Creates connection with the database.
     */
    protected createDatabaseConnection() {
        return new Promise<void>((ok, fail) => {
            const options = Object.assign(
                {},
                {
                    name: this.options.database,
                    location: this.options.location,
                },
                this.options.extra || {},
            )

            this.sqlite.openDatabase(
                options,
                (db: any) => {
                    const databaseConnection = db

                    // we need to enable foreign keys in sqlite to make sure all foreign key related features
                    // working properly. this also makes onDelete work with sqlite.
                    databaseConnection.executeSql(
                        `PRAGMA foreign_keys = ON`,
                        [],
                        (result: any) => {
                            ok(databaseConnection)
                        },
                        (error: any) => {
                            fail(error)
                        },
                    )
                },
                (error: any) => {
                    fail(error)
                },
            )
        })
    }

    /**
     * If driver dependency is not given explicitly, then try to load it via "require".
     */
    protected loadDependencies(): void {
        try {
            const sqlite =
                this.options.driver || require("react-native-sqlite-storage")
            this.sqlite = sqlite
        } catch (e) {
            throw new DriverPackageNotInstalledError(
                "React-Native",
                "react-native-sqlite-storage",
            )
        }
    }
}
