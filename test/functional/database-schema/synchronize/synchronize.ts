import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";

import {User} from "./entities/User";
import {User2} from "./entities/User2";

describe("synchronize sqlite", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [User, User2],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not report changes without a change in the model", () => Promise.all(connections.map(async connection => {
        await connection.synchronize();
        
        const schemaBuilder = connection.driver.createSchemaBuilder();
        const queries = await schemaBuilder.log();

        expect(queries.length).to.be.equal(0);

    })));
        
});
