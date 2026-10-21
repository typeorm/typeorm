import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"
import type { ReplicationMode } from "../../../src/driver/types/ReplicationMode"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("cache > query runner release", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            // Spanner does not support the built-in cache table name, so the
            // cache test suites (see custom-cache-provider) opt it out.
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            cache: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Counts query runners that the call creates on its own (no runner passed in)
    // and makes sure each one gets released. `prepare` runs on each created
    // runner, so a test can also make the underlying operation fail.
    //
    // The stub is installed on the shared DataSource, so it has to come back off
    // again: every test in this file runs against the same connections, and a
    // stub left in place would have the next test counting through this one's
    // wrapper as well.
    function trackCreatedRunners(
        dataSource: DataSource,
        prepare?: (queryRunner: QueryRunner) => void,
    ): { unreleased: () => number; restore: () => void } {
        let unreleased = 0
        const originalCreate = dataSource.createQueryRunner.bind(dataSource)
        dataSource.createQueryRunner = (
            mode?: ReplicationMode,
        ): QueryRunner => {
            const queryRunner = originalCreate(mode)
            unreleased++
            const originalRelease = queryRunner.release.bind(queryRunner)
            queryRunner.release = () => {
                unreleased--
                return originalRelease()
            }
            prepare?.(queryRunner)
            return queryRunner
        }
        return {
            unreleased: () => unreleased,
            // `createQueryRunner` is a prototype method, so deleting the own
            // property the stub added puts the real one back rather than
            // leaving a bound copy of it behind.
            restore: () => {
                Reflect.deleteProperty(dataSource, "createQueryRunner")
            },
        }
    }

    it("should release the query runner it creates in clear()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const tracker = trackCreatedRunners(dataSource)
                try {
                    await dataSource.queryResultCache!.clear()

                    expect(tracker.unreleased()).to.be.equal(0)
                } finally {
                    tracker.restore()
                }
            }),
        ))

    it("should release the query runner it creates in getFromCache()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const tracker = trackCreatedRunners(dataSource)
                try {
                    await dataSource.queryResultCache!.getFromCache({
                        query: "some-query",
                        duration: 1000,
                    })

                    expect(tracker.unreleased()).to.be.equal(0)
                } finally {
                    tracker.restore()
                }
            }),
        ))

    // Ownership: a runner passed in by the caller must NOT be released here.
    // Guards against a mutant that releases unconditionally.
    it("should not release a query runner passed in to clear()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let released = 0
                const originalRelease = queryRunner.release.bind(queryRunner)
                queryRunner.release = () => {
                    released++
                    return originalRelease()
                }

                await dataSource.queryResultCache!.clear(queryRunner)

                expect(released).to.be.equal(0)
                await queryRunner.release()
            }),
        ))

    // Failure path: the self-created runner must be released even when the
    // underlying operation throws. Guards against a mutant that releases only
    // on the success path (try-end instead of finally).
    it("should release the self-created runner in clear() even when clearTable throws", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const tracker = trackCreatedRunners(
                    dataSource,
                    (queryRunner) => {
                        queryRunner.clearTable = () =>
                            Promise.reject(new Error("boom"))
                    },
                )
                try {
                    await expect(
                        dataSource.queryResultCache!.clear(),
                    ).to.be.rejectedWith("boom")

                    expect(tracker.unreleased()).to.be.equal(0)
                } finally {
                    tracker.restore()
                }
            }),
        ))
})
