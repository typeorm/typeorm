import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"

import { Master } from "./entity/master"
import { Detail } from "./entity/detail"

describe("github issues > #863 indices > create schema", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [Master, Detail],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    describe("build schema", function () {
        it("it should just work, creating the index", () =>
            Promise.all(
                connections.map(async (connection) => {
                    await connection.synchronize(true)
                }),
            ))
    })
})
