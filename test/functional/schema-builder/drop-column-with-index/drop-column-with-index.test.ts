import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src"
import type { EntityMetadata } from "../../../../src"
import { Person } from "./entity/person"

describe("schema-builder > drop column with index", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: false,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should drop the column and its referenced index during synchronize", () =>
        Promise.all(
            dataSources.map(async (connection) => {
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
