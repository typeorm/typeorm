import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    sleep,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("github issues > #9375 UpdateDateColumn doesn't work for transformed columns during save", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["better-sqlite3", "postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should successfully update the updatedAt field", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)
                const entity = await postRepository.create({ title: `myTitle` })
                await postRepository.save(entity)
                const firstUpdatedAt = entity.updatedAt.date.toJSON()
                await sleep(1200)
                entity.title = `newTitle`
                await postRepository.save(entity)
                expect(entity.updatedAt.date.toJSON()).not.to.equal(
                    firstUpdatedAt,
                )
            }),
        ))
})
