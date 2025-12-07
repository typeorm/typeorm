import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import { DriverUtils } from "../../../../../src/driver/DriverUtils"

describe("database schema > column collation > mysql", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create column with collation option", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                const post = new Post()
                post.id = 1
                post.name = "Post"
                post.title = "Post #1"
                post.description = "This is post"
                await postRepository.save(post)

                expect(table!.findColumnByName("name")).to.include({
                    charset: "ascii",
                    collation: "ascii_general_ci",
                })

                if (
                    connection.driver.options.type === "mysql" &&
                    DriverUtils.isReleaseVersionOrGreater(
                        connection.driver,
                        "8.0",
                    )
                ) {
                    // Charset: utf8mb4 and collation: utf8mb4_0900_ai_ci are default on MySQL 8.0+
                    expect(table!.findColumnByName("title")).to.include({
                        charset: undefined,
                        collation: undefined,
                    })
                } else {
                    expect(table!.findColumnByName("title")).to.include({
                        charset: "utf8mb4",
                        collation: "utf8mb4_general_ci",
                    })
                }

                expect(table!.findColumnByName("description")).to.include({
                    charset: "cp852",
                    collation: "cp852_general_ci",
                })
            }),
        ))
})
