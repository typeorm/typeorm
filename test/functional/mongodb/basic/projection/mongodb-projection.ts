import "reflect-metadata";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Counters} from "./entity/Counters";
import {expect} from "chai";

describe("mongodb > projection", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post, Counters],
        enabledDrivers: ["mongodb"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should convert select option to projection correctly", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);

        // save few posts
        const post = new Post();
        post.title = "Post";
        post.counters = new Counters();
        post.counters.likes = 5;
        post.counters.comments = 1;
        await postRepository.save(post);

        const loadedPost = await postRepository.findOne({ title: "Post" }, {projection: {"counters.likes": 0}});

        expect(loadedPost).to.be.not.empty;
        console.log(loadedPost);
        /*expect(loadedPost!.counters).to.be.not.empty;
        loadedPost!.should.be.instanceOf(Post);
        loadedPost!.title.should.be.equal("Post");
        loadedPost!.counters.should.be.instanceOf(Counters);
        loadedPost!.counters.likes.should.be.equal(5);
        loadedPost!.counters.comments.should.be.equal(1);

        post.title = "Updated post";
        post.counters.comments = 2;
        await postRepository.save(post);

        const loadedUpdatedPost = await postRepository.findOne({ title: "Updated post" });

        expect(loadedUpdatedPost).to.be.not.empty;
        expect(loadedUpdatedPost!.counters).to.be.not.empty;
        loadedUpdatedPost!.should.be.instanceOf(Post);
        loadedUpdatedPost!.title.should.be.equal("Updated post");
        loadedUpdatedPost!.counters.should.be.instanceOf(Counters);
        loadedUpdatedPost!.counters.likes.should.be.equal(5);
        loadedUpdatedPost!.counters.comments.should.be.equal(2);

        await postRepository.remove(post);

        const removedPost = await postRepository.findOne({ title: "Post" });
        const removedUpdatedPost = await postRepository.findOne({ title: "Updated post" });
        expect(removedPost).to.be.empty;
        expect(removedUpdatedPost).to.be.empty;*/

    })));

});
