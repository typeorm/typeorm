import "reflect-metadata";
import {Post} from "./entity/Post";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {PromiseUtils} from "../../../src/util/PromiseUtils";

describe("entity-model", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save successfully and use static methods successfully", () => PromiseUtils.runInSequence(connections, async connection => {
        Post.useConnection(connection); // change connection each time because of AR specifics

        const post = Post.create();
        post.title = "About ActiveRecord";
        post.text = "Huge discussion how good or bad ActiveRecord is.";
        await post.save();

        const loadedPost = await Post.findOne(1);

        loadedPost!.should.be.instanceOf(Post);
        loadedPost!.id.should.be.eql(1);
        loadedPost!.title.should.be.eql("About ActiveRecord");
        loadedPost!.text.should.be.eql("Huge discussion how good or bad ActiveRecord is.");
    }));

});
