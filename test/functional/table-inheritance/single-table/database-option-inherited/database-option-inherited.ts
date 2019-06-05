import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src";

describe("table-inheritance > single-table > database-option-inherited", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly inherit database option", () => Promise.all(connections.map(async connection => {

        connection.entityMetadatas.forEach(metadata =>
            metadata.database!.should.equal("test"));

    })));

});
