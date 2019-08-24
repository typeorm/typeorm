import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import { Realm } from "./entity/User";
import {User} from "./entity/User";

describe("github issues > #4360 Enum string not escaping resulting in broken migrations.", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should should allow postgres enums to have apostrophes in the values", () => Promise.all(connections.map(async connection => {
        const user = new User();
        user.realm = Realm.KelThuzad;

        await connection.manager.save(user);

        const users = await connection.manager.find(User);

        users.should.eql([{
            id: 1,
            realm: "Kel'Thuzad"
        }]);
    })));
});
