import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import { Post } from "./entity/Post"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../utils/test-utils"

describe("github issues > #5160 (MSSQL) DML statement cannot have any enabled triggers if the statement contains an OUTPUT clause without INTO clause", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(async () => {
        await reloadTestingDatabases(connections)

        return Promise.all(
            connections.map(async (connection) => {
                if (!(connection.driver.options.type === "mssql")) {
                    return
                }

                return connection.query(`
                CREATE OR ALTER TRIGGER issue5160_post
                ON post AFTER INSERT, UPDATE AS
                BEGIN
                    UPDATE post
                    SET triggerValue = 1
                    WHERE id IN (SELECT id FROM inserted);
                END`)
            }),
        )
    })
    after(() => closeTestingConnections(connections))

    it("should update entity model after insertion to MSSQL table with trigger", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!(connection.driver.options.type === "mssql")) {
                    return
                }

                const post = new Post()
                post.title = "about entity updation in query builder"

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post)
                    .execute()

                post.id.should.be.a("number")
                post.id.should.be.greaterThan(0)
                post.title.should.be.equal(
                    "about entity updation in query builder",
                )
                post.order.should.be.equal(100)
                post.createDate.should.be.instanceof(Date)
                post.updateDate.should.be.instanceof(Date)
                post.triggerValue.should.be.equal(
                    0,
                    "Returned values from INSERT...OUTPUT will not reflect data modified by triggers",
                )

                // for additional safety, re-fetch entity and check that the trigger fired and updated the field as expected
                const updatedPost = await connection
                    .createQueryBuilder(Post, "post")
                    .where({ id: post.id })
                    .getOne()

                expect(updatedPost).is.not.undefined
                updatedPost!.id.should.be.equal(post.id)
                updatedPost!.triggerValue.should.be.equal(1)
            }),
        ))

    it("should update entity model after save to MSSQL table with trigger", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (!(connection.driver.options.type === "mssql")) {
                    return
                }

                const post = new Post()
                post.title = "about entity updation in query builder"
                await connection.manager.save(post)
                post.version.should.be.equal(1)

                post.title = "changed title"
                await connection.manager.save(post)
                post.version.should.be.equal(2)
                post.triggerValue.should.be.equal(
                    0,
                    "Returned values from UPDATE...OUTPUT will not reflect data modified by triggers",
                )

                // for additional safety, re-fetch entity and check that the trigger fired and updated the field as expected
                const updatedPost = await connection
                    .createQueryBuilder(Post, "post")
                    .where({ id: post.id })
                    .getOne()

                expect(updatedPost).is.not.undefined
                updatedPost!.id.should.be.equal(post.id)
                updatedPost!.triggerValue.should.be.equal(1)
            }),
        ))
})
