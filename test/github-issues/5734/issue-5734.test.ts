import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #5734 insert([]) should not crash", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should not crash on insert([])", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const repository = connection.getRepository(Post)
                await repository.insert([])
            }),
        ))

    it("should still work with a nonempty array", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const repository = connection.getRepository(Post)
                await repository.insert([new Post(1)])
                await repository.findOneOrFail({ where: { id: 1 } })
            }),
        ))
})
