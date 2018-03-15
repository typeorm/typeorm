import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {User} from "./entity/User";
import {Comment} from "./entity/Comment";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("github issues > #9999 Nested entities should be removed when cascade remove is used together with isPrimary on the inverse side", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should remove related entity when cascade remove is used while the inverse side is primary or not nullable", () => Promise.all(connections.map(async connection => {

        const user = new User();

        const post = new Post();
        post.id = 1;

        const comment = new Comment();
        comment.user = user;
        comment.post = post;
        comment.message = "Message";

        await connection.manager.save([user, post, comment]);

        let postLoadedWithEager = await connection.manager.findOneOrFail(Post, 1);

        expect(postLoadedWithEager.comments).to.be.an("array").and.to.have.length(1);

        postLoadedWithEager.comments.splice(0, 1);

        postLoadedWithEager = await connection.manager.save(postLoadedWithEager);

        expect(postLoadedWithEager.comments).to.be.an("array").and.to.have.length(0);

    })));

});
