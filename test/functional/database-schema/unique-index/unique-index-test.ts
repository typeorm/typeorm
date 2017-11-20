import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
 
import {Person} from "./entity/person";
import {User} from "./entity/user";

describe("indices > reading index from entity schema and updating database", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Person, User],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("create index", function() {

        it("should just work", () => Promise.all(connections.map(async connection => {
            
            await connection.synchronize(false);

        })));

    });

});
