import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("github issues > #813 order by must support functions", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should work perfectly", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!DriverUtils.isMySQLFamily(connection.driver)) return

                const categories = [new Category(), new Category()]
                await connection.manager.save(categories)

                const post = new Post()
                post.title = "About order by"
                post.categories = categories
                await connection.manager.save(post)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "categories")
                    .orderBy("RAND()")
                    .getMany()

                posts[0].id.should.be.equal(1)
                posts[0].title.should.be.equal("About order by")
            }),
        ))

    it("should work perfectly with pagination as well", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!DriverUtils.isMySQLFamily(connection.driver)) return

                const categories = [new Category(), new Category()]
                await connection.manager.save(categories)

                const post = new Post()
                post.title = "About order by"
                post.categories = categories
                await connection.manager.save(post)

                const posts = await connection
                    .createQueryBuilder(Post, "post")
                    .leftJoinAndSelect("post.categories", "categories")
                    .orderBy("RAND()")
                    .skip(0)
                    .take(1)
                    .getMany()

                posts[0].id.should.be.equal(1)
                posts[0].title.should.be.equal("About order by")
            }),
        ))
})
