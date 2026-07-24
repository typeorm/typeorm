import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"
import { MigrationExecutor } from "../../../src/migration/MigrationExecutor"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("github issues > #12243 MigrationExecutor leaks queryRunner when setup methods throw", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [],
            migrations: [],
            enabledDrivers: ["better-sqlite3"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // Counts release() calls on the query runner that the executor creates for
    // itself and forces one of the setup awaits (loadExecutedMigrations) to
    // throw. The runner must still be released even though the failure happens
    // before the main work. release() is wrapped manually (rather than with a
    // sinon spy) because the sqlite drivers hand back the same shared runner
    // instance on every createQueryRunner() call.
    function setupLeakProbe(dataSource: DataSource) {
        const error = new Error("simulated setup failure")
        const executor = new MigrationExecutor(dataSource)

        let createdRunner: QueryRunner | undefined
        let releaseCount = 0
        let originalRelease: QueryRunner["release"] | undefined
        const createQueryRunner = dataSource.createQueryRunner.bind(dataSource)
        const createStub = sinon
            .stub(dataSource, "createQueryRunner")
            .callsFake((mode) => {
                createdRunner = createQueryRunner(mode)
                originalRelease = createdRunner.release.bind(createdRunner)
                createdRunner.release = () => {
                    releaseCount++
                    return originalRelease!()
                }
                return createdRunner
            })

        const loadStub = sinon
            .stub(executor as any, "loadExecutedMigrations")
            .rejects(error)

        return {
            executor,
            error,
            getRunner: () => createdRunner,
            getReleaseCount: () => releaseCount,
            restore: () => {
                createStub.restore()
                loadStub.restore()
                if (createdRunner && originalRelease)
                    createdRunner.release = originalRelease
            },
        }
    }

    it("releases the query runner when showMigrations fails during setup", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const probe = setupLeakProbe(dataSource)
                try {
                    await expect(
                        probe.executor.showMigrations(),
                    ).to.be.rejectedWith(probe.error)

                    expect(
                        probe.getRunner(),
                        "a query runner should have been created",
                    ).to.not.be.undefined
                    expect(
                        probe.getReleaseCount(),
                        "query runner should be released exactly once",
                    ).to.equal(1)
                } finally {
                    probe.restore()
                }
            }),
        ))

    it("releases the query runner when executePendingMigrations fails during setup", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const probe = setupLeakProbe(dataSource)
                try {
                    await expect(
                        probe.executor.executePendingMigrations(),
                    ).to.be.rejectedWith(probe.error)

                    expect(
                        probe.getRunner(),
                        "a query runner should have been created",
                    ).to.not.be.undefined
                    expect(
                        probe.getReleaseCount(),
                        "query runner should be released exactly once",
                    ).to.equal(1)
                } finally {
                    probe.restore()
                }
            }),
        ))

    it("releases the query runner when undoLastMigration fails during setup", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const probe = setupLeakProbe(dataSource)
                try {
                    await expect(
                        probe.executor.undoLastMigration(),
                    ).to.be.rejectedWith(probe.error)

                    expect(
                        probe.getRunner(),
                        "a query runner should have been created",
                    ).to.not.be.undefined
                    expect(
                        probe.getReleaseCount(),
                        "query runner should be released exactly once",
                    ).to.equal(1)
                } finally {
                    probe.restore()
                }
            }),
        ))
})
