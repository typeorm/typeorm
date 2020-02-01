import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {PostWithRelation} from "./entity/PostWithRelation";

// This test is neccessary because finding with eager relation will be run in the different way
describe(`repository > the global condtion of "non-deleted" with eager relation`, () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it(`The global condition of "non-deleted" should be set for the entity with delete date columns and eager relation`, () => Promise.all(connections.map(async connection => {

        const post1 = new PostWithRelation();
        post1.title = "title#1";
        const post2 = new PostWithRelation();
        post2.title = "title#2";
        const post3 = new PostWithRelation();
        post3.title = "title#3";

        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);

        await connection.manager.softRemove(post1);

        const loadedPosts = await connection
            .getRepository(PostWithRelation)
            .find();
        loadedPosts!.length.should.be.equal(2);
        loadedPosts![0].title.should.be.equals("title#2");
        loadedPosts![1].title.should.be.equals("title#3");

        const loadedPost = await connection
            .getRepository(PostWithRelation)
            .findOne();
        loadedPost!.title.should.be.equals("title#2");

    })));

    it(`The global condition of "non-deleted" should not be set when the option "withDeleted" is set to true`, () => Promise.all(connections.map(async connection => {

        const post1 = new PostWithRelation();
        post1.title = "title#1";
        const post2 = new PostWithRelation();
        post2.title = "title#2";
        const post3 = new PostWithRelation();
        post3.title = "title#3";

        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);

        const loadedPosts = await connection
            .getRepository(PostWithRelation)
            .find({
                withDeleted: true,
            });

        loadedPosts!.length.should.be.equal(3);
        loadedPosts![0].title.should.be.equals("title#1");
        loadedPosts![1].title.should.be.equals("title#2");
        loadedPosts![2].title.should.be.equals("title#3");

        const loadedPost = await connection
            .getRepository(PostWithRelation)
            .findOne({
                withDeleted: true,
            });
        loadedPost!.title.should.be.equals("title#1");

    })));
});