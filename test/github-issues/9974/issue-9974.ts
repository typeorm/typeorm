import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import {DataSource} from "../../../src/data-source/DataSource"
import {expect} from "chai"
import {Post} from "./entity/Post"
import {Author} from "./entity/Author";
import {AuthorPostSubscriber} from "./subscriber/AuthorPostSubscriber";
import {PostWithCascade} from "./entity/PostWithCascade";
import {AuthorPostWithCascadeSubscriber} from "./subscriber/AuthorPostWithCascadeSubscriber";

describe("github issues > #9974 EventSubscriber beforeInsert, afterInsert missing data for junctionTables", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [AuthorPostSubscriber, AuthorPostWithCascadeSubscriber],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => {
        AuthorPostSubscriber.beforeInsertEntity = undefined;
        AuthorPostSubscriber.afterInsertEntity = undefined;

        AuthorPostWithCascadeSubscriber.beforeInsertEntity = undefined;
        AuthorPostWithCascadeSubscriber.afterInsertEntity = undefined;

        return reloadTestingDatabases(dataSources)
    })
    after(() => closeTestingConnections(dataSources))

    it("should have entity set inside subscriber", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const author = new Author();
                author.name = "author"
                await manager.save(author);

                const post = new Post()
                post.name = "post"
                post.authors = [author]
                await manager.save(post)

                // Before is undefined since post is not saved yet and has no ID in beforeInsert
                expect(AuthorPostSubscriber.beforeInsertEntity).to.be.eql({authorId: 1, postId: undefined})
                expect(AuthorPostSubscriber.afterInsertEntity).to.be.eql({authorId: 1, postId: 1})
            }),
        ))

    it("should have entity set inside subscriber with cascade", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const author = new Author();
                author.name = "author"

                const post = new PostWithCascade()
                post.name = "post"
                post.authors = [author]
                await manager.save(post)

                // Before is undefined since post and author are not saved yet and have no ID in beforeInsert
                expect(AuthorPostWithCascadeSubscriber.beforeInsertEntity).to.be.eql({authorId: undefined, postWithCascadeId: undefined})
                expect(AuthorPostWithCascadeSubscriber.afterInsertEntity).to.be.eql({authorId: 1, postWithCascadeId: 1})
            }),
        ))

    it("should have entity set inside subscriber with queryBuilder", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const author = new Author();
                author.name = "author"
                await manager.save(author)

                const post = new Post()
                post.name = "post"
                await manager.save(post)

                await dataSource.createQueryBuilder().relation(Post, "authors").of(1).add(1);

                expect(AuthorPostSubscriber.beforeInsertEntity).to.be.eql({authorId: 1, postId: 1})
                expect(AuthorPostSubscriber.afterInsertEntity).to.be.eql({authorId: 1, postId: 1})
            }),
        ))
})
