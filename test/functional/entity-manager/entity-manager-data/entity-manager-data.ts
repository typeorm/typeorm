import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe.skip("entity manager > custom data", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should set data into entity manager and retrieve it successfully", () => Promise.all(connections.map(async connection => {

        const user = { name: "Dima" };
        connection.manager.setData("user", user);
        expect(connection.manager.getData("user")).to.be.not.empty;
        connection.manager.getData("user").should.be.equal(user);

    })));

    it("change in subscriber should update data set in entity manager", () => Promise.all(connections.map(async connection => {

        const user = { name: "Dima" };
        connection.manager.setData("user", user);

        const post = new Post();
        post.title = "New post";
        await connection.manager.save(post);

        expect(connection.manager.getData("user")).to.be.not.empty;
        connection.manager.getData("user").should.be.eql({ name: "Updated Dima" });

    })));

});
