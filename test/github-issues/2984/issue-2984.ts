import "reflect-metadata";

import {closeTestingConnections, reloadTestingDatabases, setupSingleTestingConnection} from "../../utils/test-utils";
import {createConnection, Connection} from "../../../src";

describe("github issues > #2984 Discriminator conflict reported even for non-inherited tables", () => {
    let connection: Connection;

    before(async () => connection = await createConnection(setupSingleTestingConnection("postgres", {
        entities: [__dirname + "/entity/**/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    })));
    beforeEach(async () => {
        await reloadTestingDatabases([connection]);
    });
    after(() => closeTestingConnections([connection]));

    it("should load entities even with the same discriminator", async () => {
        connection.entityMetadatas.should.have.length(2);
        connection.entityMetadatas.forEach(metadata =>
            metadata.discriminatorValue!.should.be.equal("Note"));
    });

});
