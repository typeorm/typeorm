import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
import {Test} from "./entity/Test";

describe("query builder > count", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Test],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Count query should be completed successfully", () => Promise.all(connections.map(async connection => {
        const count = await connection.getRepository(Test).count();
        expect(count).to.be.equal(0);
    })));

});
