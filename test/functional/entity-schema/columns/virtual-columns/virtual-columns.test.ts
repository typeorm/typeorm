import "reflect-metadata"

import { Activity } from "./entity/Activity"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("entity-schema > columns > virtual column", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [<any>Activity],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should query virtual columns", () => {
        return Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(Activity)
                await repo.save({ id: 0, k1: 1 })
                const result = (await repo.findOne({ where: { id: 0 } }))!
                expect(result.vK1).eq(result.k1)
                expect(result.vK1).eq(1)
            }),
        )
    })
})
