import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
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

describe("github issues > #3374 Synchronize issue with UUID (MySQL)", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not drop primary column again", () =>
        Promise.all(
            connections.map(async function (connection) {
                const post = new Post()
                post.id = 1
                post.name = "hello world"
                await connection.manager.save(post)

                await connection.synchronize()

                const loadedPost = await connection.manager.findBy(Post, {
                    name: "hello world",
                })
                expect(loadedPost).to.be.not.empty
            }),
        ))
})
