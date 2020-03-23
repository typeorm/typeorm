import "reflect-metadata";
import { expect } from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("github issues > #2651 set shouldn't have update statements twice when UpdateDate is in use", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should add and remove relations of an entity if given a mix of ids and objects", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(post1);

        // within this issue update was failing
        await connection.manager.update(Post, {
            id: 1
        }, {
            title: "updated post",
            updatedAt: new Date()
        });

        const loadedPost1 = await connection.manager.findOneOrFail(Post, { id: 1 });
        expect(loadedPost1.title).to.be.eql("updated post");

    })));

});
