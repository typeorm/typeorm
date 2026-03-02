import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { expect } from "chai"
import { Role } from "./set"

describe("github issues > #2779 Could we add support for the MySQL/MariaDB SET data type?", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mariadb", "mysql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should create column with SET datatype", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                table!.findColumnByName("roles")!.type.should.be.equal("set")
                await queryRunner.release()
            }),
        ))

    it("should persist and hydrate sets", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const targetValue = [Role.Support, Role.Developer]

                const post = new Post()
                post.roles = targetValue
                await connection.manager.save(post)
                post.roles.should.be.deep.equal(targetValue)

                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: post.id,
                })
                expect(loadedPost).not.to.be.null
                loadedPost!.roles.should.be.deep.equal(targetValue)
            }),
        ))
})
