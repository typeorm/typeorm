import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";

describe("migrations > show command", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [__dirname + "/migration/*.js"],
        enabledDrivers: ["postgres"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("can recognise pending migrations", () => Promise.all(connections.map(async connection => {
        const migrations = await connection.showMigrations();
        migrations.should.be.equal(true);
    })));

    it("can recognise no pending migrations", () => Promise.all(connections.map(async connection => {
        await connection.runMigrations();
        const migrations = await connection.showMigrations();
        migrations.should.be.equal(false);
    })));
 });
