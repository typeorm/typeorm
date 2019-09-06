import "reflect-metadata";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Migration } from "../../../src/migration/Migration";

describe("github issues > #4701 Duplicate migrations are executed.", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [__dirname + "/migration/*.js"],
        enabledDrivers: ["postgres"],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should skip duplicate pending migrations", () => Promise.all(connections.map(async connection => {
        const mymigr: Migration[] = await connection.runMigrations();
        mymigr.length.should.be.equal(1);
        mymigr[0].name.should.be.equal("ExampleMigration1567759789051");
    })));
});
