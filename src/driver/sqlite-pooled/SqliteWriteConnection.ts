import { captureException } from "@sentry/node"
import { Database as Sqlite3Database } from "sqlite3"
import {
    DbLease,
    DbLeaseHolder,
    DbLeaseOwner,
    SqliteConnectionPool,
} from "./SqlitePooledTypes"
import { Mutex, MutexInterface, withTimeout, E_TIMEOUT } from "async-mutex"
import assert from "assert"
import { DriverAlreadyReleasedError } from "../../error/DriverAlreadyReleasedError"
import { SqliteLibrary } from "./SqliteLibrary"
import { LeasedDbConnection } from "./LeasedDbConnection"
import { TimeoutTimer } from "./Timer"

/**
 * A single write connection to the database.
 */
export class SqliteWriteConnection
    implements SqliteConnectionPool, DbLeaseOwner
{
    private writeConnectionPromise: Promise<Sqlite3Database> | null = null

    /**
     * Should the connection be re-created after it has been released
     */
    private isConnectionValid = true

    private isReleased = false

    /**
     * Mutex to control access to the write connection.
     */
    private readonly writeConnectionMutex: MutexInterface

    private dbLease: DbLease | undefined

    constructor(
        private readonly sqliteLibray: SqliteLibrary,
        private readonly options: {
            acquireTimeout: number
            destroyTimeout: number
        },
    ) {
        const acquireTimeout = options.acquireTimeout

        this.writeConnectionMutex = withTimeout(new Mutex(), acquireTimeout)
    }

    public async connect() {
        this.assertNotReleased()

        await this.writeConnectionMutex.runExclusive(
            async () => await this.createConnection(),
        )
    }

    public async close(): Promise<void> {
        if (this.isReleased) return

        this.isReleased = true

        // Cancel any pending acquires
        this.writeConnectionMutex.cancel()
        // If there is an existing lease, request it to be released
        if (this.dbLease) {
            this.dbLease.requestRelease()
        }

        const timeoutTimer = TimeoutTimer.start(this.options.destroyTimeout)
        await Promise.race([
            this.writeConnectionMutex.acquire(),
            timeoutTimer.promise,
        ]).finally(() => {
            timeoutTimer.clear()
        })

        if (this.writeConnectionPromise) {
            const dbConnection = await this.writeConnectionPromise
            this.sqliteLibray.destroyDatabaseConnection(dbConnection)
        }
    }

    public async runExclusive<T>(
        dbLeaseHolder: DbLeaseHolder,
        callback: (dbLease: DbLease) => Promise<T>,
    ): Promise<T> {
        this.assertNotReleased()

        try {
            return await this.writeConnectionMutex.runExclusive(async () => {
                this.dbLease = await this.createAndGetConnection(dbLeaseHolder)

                const result = await callback(this.dbLease)

                return result
            })
        } catch (error) {
            if (error === E_TIMEOUT) {
                captureException(error)
            }

            throw error
        } finally {
            this.dbLease = undefined
        }
    }

    public async leaseConnection(dbLeaseHolder: DbLeaseHolder) {
        this.assertNotReleased()

        try {
            await this.writeConnectionMutex.acquire()
        } catch (error) {
            captureException(error)
            throw error
        }

        this.dbLease = await this.createAndGetConnection(dbLeaseHolder)
        return this.dbLease
    }

    public invalidateConnection(leasedDbConnection: DbLease): void {
        assert(this.dbLease === leasedDbConnection)
        assert(this.writeConnectionMutex.isLocked())
        assert(this.writeConnectionPromise)
        this.isConnectionValid = false
    }

    public async releaseConnection(leasedDbConnection: DbLease) {
        assert(this.dbLease === leasedDbConnection)
        assert(this.writeConnectionMutex.isLocked())
        assert(this.writeConnectionPromise)

        try {
            const connection = await this.writeConnectionPromise
            if (!this.isConnectionValid) {
                this.sqliteLibray.destroyDatabaseConnection(connection)
                this.writeConnectionPromise = null
            }
        } finally {
            this.dbLease = undefined
            this.writeConnectionMutex.release()
        }
    }

    private async createAndGetConnection(
        dbLeaseHolder: DbLeaseHolder,
    ): Promise<LeasedDbConnection> {
        if (!this.writeConnectionPromise) {
            this.writeConnectionPromise =
                this.sqliteLibray.createDatabaseConnection()
        }

        const dbConnection = await this.writeConnectionPromise

        assert(!this.dbLease)
        return new LeasedDbConnection(dbConnection, this, dbLeaseHolder)
    }

    private async createConnection() {
        this.assertNotReleased()

        if (this.writeConnectionPromise) {
            throw new Error("Connection already created")
        }

        this.writeConnectionPromise =
            this.sqliteLibray.createDatabaseConnection()
        return this.writeConnectionPromise
    }

    private assertNotReleased() {
        if (this.isReleased) {
            throw new DriverAlreadyReleasedError()
        }
    }
}
