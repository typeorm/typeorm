import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Item} from "./entity/Item";
import {User} from "./entity/User";

describe("github issues > #495 Unable to set multi-column indices", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should successfully create indices and save an object", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "stonecold";

        const item = new Item();
        item.userData = user;
        item.mid = 1;

        await connection.manager.save(user);
        await connection.manager.save(item);
    })));

});
