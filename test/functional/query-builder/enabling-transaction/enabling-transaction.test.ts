import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("query builder > enabling transaction", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({ __dirname })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should execute query in a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "about transactions in query builder"

                await dataSource
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
