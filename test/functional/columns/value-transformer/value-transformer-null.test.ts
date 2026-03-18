import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { PostWithNullTransformer } from "./entity/PostWithNullTransformer"

describe("columns > value-transformer > null transform", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [PostWithNullTransformer],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should run transform from if column is null", () =>
        Promise.all(
            dataSources.map(async function (connection) {
                const post = new PostWithNullTransformer()
                post.id = 1
                await connection
                    .getRepository(PostWithNullTransformer)
                    .save(post)

                const loadedPost = await connection
                    .getRepository(PostWithNullTransformer)
                    .findOneBy({ id: 1 })

                loadedPost!.text!.should.be.eq("This is null")
            }),
        ))
})
