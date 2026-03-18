import "reflect-metadata"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("persistence > insert > update-relation-columns-after-insertion", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should work perfectly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create category
                const category1 = new Category()
                category1.name = "Category saved by cascades #1"
                await dataSource.manager.save(category1)

                // create post
                const post1 = new Post()
                post1.title = "Hello Post #1"
                post1.category = category1
                await dataSource.manager.save(post1)

                // todo: HERE FOR CALCULATIONS WE NEED TO CALCULATE OVERALL NUMBER OF QUERIES TO PREVENT EXTRA QUERIES
            }),
        ))
})
