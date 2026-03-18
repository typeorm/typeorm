import "reflect-metadata"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"

describe("database schema > column collation > mssql", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should correctly create column with collation option", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const post = new Post()
                post.id = 1
                post.name = "Post"
                await postRepository.save(post)

                table!
                    .findColumnByName("name")!
                    .collation!.should.be.equal("French_CI_AS")
            }),
        ))
})
