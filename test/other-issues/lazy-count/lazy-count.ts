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
import { Comment } from "./entity/Comment"

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

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).to.be.empty
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

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).to.be.empty
            }),
        ))

    it("skip count query when an offset is defined", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .limit(10)
                    .offset(3)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(2)

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).to.be.empty
            }),
        ))

    it("skip count query when skip is defined", () =>
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

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).to.be.empty
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

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).not.to.be.empty
            }),
        ))

    it("skip count query when joining a subentity with a take", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .innerJoin("post.comments", "comments")
                    .take(20)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(5)

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).to.be.empty
            }),
        ))

    it("run count query when joining a subentity with a limit", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .innerJoin("post.comments", "comments")
                    .limit(20)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(5)

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).not.to.be.empty
            }),
        ))

    it("skip count query when joining a subentity with a take and a skip", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .innerJoin("post.comments", "comments")
                    .take(3)
                    .skip(3)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(2)

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).to.be.empty
            }),
        ))

    it("run count query when joining a subentity with a limit and an offset", () =>
        Promise.all(
            connections.map(async function (connection) {
                await savePostEntities(connection, 5)

                const afterQuery = connection
                    .subscribers[0] as AfterQuerySubscriber
                afterQuery.clear()

                const [entities, count] = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .innerJoin("post.comments", "comments")
                    .limit(3)
                    .offset(3)
                    .orderBy("post.id")
                    .getManyAndCount()

                expect(count).to.be.equal(5)
                expect(entities.length).to.be.equal(2)

                expect(
                    afterQuery
                        .getCalledQueries()
                        .filter((query) => query.match(/(count|cnt)/i)),
                ).not.to.be.empty
            }),
        ))

    async function savePostEntities(connection: DataSource, count: number) {
        for (let i = 1; i <= count; i++) {
            const post = new Post()
            post.content = "Hello Post #" + i
            post.comments = [
                new Comment(`comment 1 for post ${i}`),
                new Comment(`comment 2 for post ${i}`),
            ]

            await connection.manager.save(post)
        }
    }
})
