import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { In } from "../../../src"

describe("github issues > #1245 `findByIds` ignores `FindManyOptions`", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should filter correctly using findByIds", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post1 = new Post()
                post1.name = "some_name"

                const post2 = new Post()
                post2.name = "some_name"

                const post3 = new Post()
                post3.name = "other_name"

                await connection.manager.save([post1, post2, post3])

                expect(
                    await connection.manager.findBy(Post, {
                        id: In([post2.id, post3.id]),
                        name: "some_name",
                    }),
                ).to.eql([post2])
            }),
        ))

    it("should filter correctly using findByIds", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post1 = new Post()
                post1.name = "some_name"

                const post2 = new Post()
                post2.name = "some_name"

                const post3 = new Post()
                post3.name = "other_name"

                await connection.manager.save([post1, post2, post3])

                expect(
                    await connection.manager.findBy(Post, {
                        id: In([post2.id, post3.id]),
                        name: "some_name",
                    }),
                ).to.eql([post2])
            }),
        ))
})
