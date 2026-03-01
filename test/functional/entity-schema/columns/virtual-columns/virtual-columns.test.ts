import "reflect-metadata"

import { Activity } from "./entity/Activity"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src"
import { expect } from "chai"

describe("entity-schema > columns > virtual column", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [<any>Activity],
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should query virtual columns", () => {
        return Promise.all(
            dataSources.map(async (connection) => {
                const repo = connection.getRepository(Activity)
                await repo.save({ id: 0, k1: 1 })
                const result = (await repo.findOne({ where: { id: 0 } }))!
                expect(result.vK1).eq(result.k1)
                expect(result.vK1).eq(1)
            }),
        )
    })
})
