import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { EntityMetadata } from "../../../src"
import { Person } from "./entity/person"

describe("github issues > #197 Fails to drop indexes when removing fields", () => {
    let connections: DataSource[]
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: false,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("it should drop the column and the referenced index", () =>
        Promise.all(
            connections.map(async (connection) => {
                const entityMetadata: EntityMetadata =
                    connection.getMetadata(Person)
                const idx: number = entityMetadata.columns.findIndex(
                    (x) => x.databaseName === "firstname",
                )
                entityMetadata.columns.splice(idx, 1)
                entityMetadata.indices = [] // clear the referenced index from metadata too

                await connection.synchronize(false)
            }),
        ))
})
