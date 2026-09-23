import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import type { ReplicationMode } from "../../../src/driver/types/ReplicationMode"
import type { QueryRunner } from "../../../src/query-runner/QueryRunner"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("schema builder > query runner release", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            // mongodb uses a shared runner whose release is a no-op
            disabledDrivers: ["mongodb"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // build() creates its own runner and must release it on every path,
    // the same rule the cache layer follows (see cache/query-runner-release).
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
            restore: () => {
                Reflect.deleteProperty(dataSource, "createQueryRunner")
            },
        }
    }

    it("should release the query runner created by build()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const tracker = trackCreatedRunners(dataSource)
                try {
                    await dataSource.synchronize()

                    expect(tracker.unreleased()).to.be.equal(0)
                } finally {
                    tracker.restore()
                }
            }),
        ))

    it("should release the query runner created by build() even when beforeMigration throws", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const tracker = trackCreatedRunners(
                    dataSource,
                    (queryRunner) => {
                        queryRunner.beforeMigration = () =>
                            Promise.reject(new Error("boom"))
                    },
                )
                try {
                    await expect(dataSource.synchronize()).to.be.rejectedWith(
                        "boom",
                    )

                    expect(tracker.unreleased()).to.be.equal(0)
                } finally {
                    tracker.restore()
                }
            }),
        ))
})
