import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {User} from "./entity/User";

describe("github issues > #1584 Cannot read property 'createValueMap' of undefined", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mongodb"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save entities properly", () => Promise.all(connections.map(async connection => {
        await connection.manager.save(connection.manager.create(User, {
            name: "Timber Saw"
        }));
    })));

});
