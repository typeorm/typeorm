import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #773 @PrimaryGeneratedColumn not returning auto generated id from oracle database", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should return auto generated column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const post = new Post()
                post.name = "My post"
                await connection.getRepository(Post).save(post)
                expect(post.id).to.be.not.undefined
                expect(post.createdDate).to.be.not.undefined
                expect(post.updatedDate).to.be.not.undefined
            }),
        ))
})
