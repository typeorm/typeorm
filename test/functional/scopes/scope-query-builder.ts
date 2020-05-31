import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Post} from "./entity/Post";

describe("scopes > query builder", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should apply global scope", () => Promise.all(connections.map(async connection => {
        await connection
            .createQueryBuilder()
            .insert()
            .into(Post)
            .values([
                { title: "post #1", stage: "public", views: 100 },
                { title: "post #2", stage: "draft", views: 200 },
                { title: "post #3", stage: "public", views: 10 },
                { title: "post #4", stage: "public", views: 200 },
                { title: "post #5", stage: "public", views: 300 },
            ])
            .execute();

        const posts = await connection
            .getRepository(Post)
            .createQueryBuilder("post")
            .getMany();

        expect(posts.length).equal(3);
        posts[0].title.should.equal("post #1");
        posts[1].title.should.equal("post #4");
        posts[2].title.should.equal("post #5");

        const posts2 = await connection
            .getRepository(Post)
            .createQueryBuilder("post")
            .scope(Post.idAtMost(4))
            .getMany();

        expect(posts2.length).equal(2);
        posts[0].title.should.equal("post #1");
        posts[1].title.should.equal("post #4");
    })));

    it("should not apply scope when unscoped", () => Promise.all(connections.map(async connection => {
        await connection
            .createQueryBuilder()
            .insert()
            .into(Post)
            .values([
                { title: "post #1", stage: "public", views: 10 },
                { title: "post #2", stage: "draft", views: 10 },
                { title: "post #3", stage: "public", views: 10 },
            ])
            .execute();

        const posts = await connection
            .getRepository(Post)
            .createQueryBuilder("post")
            .unscoped()
            .getMany();

        expect(posts.length).equal(3);

        const publicPosts = await connection
            .getRepository(Post)
            .createQueryBuilder("post")
            .unscoped()
            .scope(Post.isPublic)
            .getMany();

        expect(publicPosts.length).equal(2);
        publicPosts[0].title.should.equal("post #1");
        publicPosts[1].title.should.equal("post #3");
    })));


    it("should apply scope with parameter, multiple scopes, scope in multiple times", () => Promise.all(connections.map(async connection => {
        await connection
            .createQueryBuilder()
            .insert()
            .into(Post)
            .values([
                { title: "post #1", stage: "public", views: 100 },
                { title: "post #2", stage: "draft", views: 200 },
                { title: "post #3", stage: "public", views: 300 },
                { title: "post #4", stage: "draft", views: 100 },
            ])
            .execute();

        const draftAndView200Posts = await connection
            .getRepository(Post)
            .createQueryBuilder("post")
            .unscoped()
            .scope([Post.hasViewsAtLeast(200), Post.isDraft])
            .getMany();

        expect(draftAndView200Posts.length).equal(1);
        draftAndView200Posts[0].title.should.equal("post #2");

        const draftAndView200Posts2 = await connection
            .getRepository(Post)
            .createQueryBuilder("post")
            .unscoped()
            .scope(Post.hasViewsAtLeast(200))
            .scope(Post.isDraft)
            .getMany();

        expect(draftAndView200Posts2.length).equal(1);
        draftAndView200Posts2[0].title.should.equal("post #2");


        const draftAndView200Posts3 = await connection
            .getRepository(Post)
            .createQueryBuilder("post")
            .unscoped()
            .scope(Post.draftAndView200)
            .getMany();

        expect(draftAndView200Posts3.length).equal(1);
        draftAndView200Posts3[0].title.should.equal("post #2");
    })));

});