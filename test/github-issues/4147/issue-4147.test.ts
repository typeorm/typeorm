import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { EntitySchema } from "../../../src"
import { Post, PostSchema } from "./entity/Post"

describe('github issues > #4147 `SQLITE_ERROR: near "-": syntax error` when use sqlite, simple-enum', () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [new EntitySchema<Post>(PostSchema)],
                dropSchema: true,
                enabledDrivers: ["better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not error while synchronizing when using simple-enum with sqlite", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.synchronize()
                await connection.synchronize()
            }),
        ))
})
