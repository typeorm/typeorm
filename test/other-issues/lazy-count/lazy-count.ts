import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"
import { AfterQuerySubscriber } from "./subscribers/AfterQuerySubscriber"

describe("other issues > lazy count", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [AfterQuerySubscriber],
                dropSchema: true,
                schemaCreate: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("skip count query when less entities are returned than the limit", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .limit(10)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(5)

                expect(afterQuery.calls()).to.be.equal(1)
                expect(afterQuery.lastCalledQuery()).to.not.match(
                    /(count|cnt)/i,
                )
            }),
        ))

    it("skip count query when less entities are returned than the take", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .take(10)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(5)

                expect(afterQuery.calls()).to.be.equal(1)
                expect(afterQuery.lastCalledQuery()).to.not.match(
                    /(count|cnt)/i,
                )
            }),
        ))

    it("run count query when returned entities reach the take", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 2)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .take(2)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(2)
                expect(entities.length).to.be.equal(2)

                expect(afterQuery.calls()).to.be.equal(2)
                expect(afterQuery.lastCalledQuery()).to.match(/(count|cnt)/i)
            }),
        ))

    it("run count query when an offset is defined", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .take(10)
                    .skip(3)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(2)

                expect(afterQuery.calls()).to.be.equal(2)
                expect(afterQuery.lastCalledQuery()).to.match(/(count|cnt)/i)
            }),
        ))

    async function savePostEntities(connection: DataSource, count: number) {
        for (let i = 1; i <= count; i++) {
            const post = new Post()
            post.content = "Hello Post #" + i

            await connection.manager.save(post)
        }
    }
})
