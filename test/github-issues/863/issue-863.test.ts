import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"

import { Master } from "./entity/master"
import { Detail } from "./entity/detail"

describe("github issues > #863 indices > create schema", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Master, Detail],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("build schema", function () {
        it("it should just work, creating the index", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    await connection.synchronize(true)
                }),
            ))
    })
})
