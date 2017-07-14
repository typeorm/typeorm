import "reflect-metadata";
import * as chai from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {expect} from "chai";

const should = chai.should();

describe("query builder > delete", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform deletion correctly", () => Promise.all(connections.map(async connection => {

        const user1 = new User();
        user1.name = "Alex Messer";
        await connection.manager.save(user1);

        await connection.createQueryBuilder()
            .delete()
            .from(User)
            .where("name = :name", { name: "Alex Messer" })
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ name: "Dima Zotov" });
        expect(loadedUser1).to.not.exist;

        const user2 = new User();
        user2.name = "Alex Messer";
        await connection.manager.save(user2);

        await connection.getRepository(User)
            .createQueryBuilder("myUser")
            .delete()
            .where("myUser.name = :name", { name: "Dima Zotov" })
            .execute();

        const loadedUser2 = await connection.getRepository(User).findOne({ name: "Dima Zotov" });
        expect(loadedUser2).to.not.exist;

    })));

});