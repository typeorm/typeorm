import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"

describe("github issues > #108 Error with constraint names on postgres", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                driverSpecific: { synchronize: false },
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should sync even when there unique constraints placed on similarly named columns", () =>
        Promise.all(
            connections.map(async (connection) => {
                await expect(connection.synchronize()).to.eventually.be
                    .fulfilled
            }),
        ))
})
