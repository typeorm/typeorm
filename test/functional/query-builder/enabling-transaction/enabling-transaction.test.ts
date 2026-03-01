import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("query builder > enabling transaction", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({ __dirname })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should execute query in a transaction", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                post.title = "about transactions in query builder"

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post)
                    .useTransaction(true)
                    .execute()

                // todo: check if transaction query was executed
            }),
        ))

    // todo: add tests for update and remove queries as well
})
