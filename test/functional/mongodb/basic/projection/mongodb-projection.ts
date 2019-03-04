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

        const loadedPost1 = await postRepository.findOne({ title: "Post" }, {projection: {"counters.likes": 0}});
        const loadedPost2 = await postRepository.findByIds([post.id], {projection: {"title": 1}});

        expect(loadedPost1).to.be.not.empty;
        expect(loadedPost1!.counters.likes!).to.be.undefined;
        loadedPost1!.counters.comments.should.be.equal(1);
        expect(loadedPost2[0]).to.be.not.empty;
        expect(loadedPost2[0].title).to.be.not.empty;
        expect(loadedPost2[0]!.counters!).to.be.undefined;

    })));

});
