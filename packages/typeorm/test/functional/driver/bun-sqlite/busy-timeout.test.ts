import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"

describe("bun:sqlite driver > busy-timeout", () => {
    let dataSources: DataSource[]

    describe("custom timeout", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["bun-sqlite"],
                driverSpecific: {
                    timeout: 2000,
                },
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should set the busy_timeout as expected", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const result = await dataSource.query("PRAGMA busy_timeout")
                    expect(result).to.eql([{ timeout: 2000 }])
                }),
            ))
    })

    describe("default timeout", () => {
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [],
                enabledDrivers: ["bun-sqlite"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should default busy_timeout to 5000", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const result = await dataSource.query("PRAGMA busy_timeout")
                    expect(result).to.eql([{ timeout: 5000 }])
                }),
            ))
    })
})
