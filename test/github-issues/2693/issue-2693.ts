import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Migration} from "../../../src/migration/Migration";

describe("github issues > #2875 Option to run migrations in 1-transaction-per-migration mode", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [__dirname + "/migration/*.js"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should fail to run all necessary migrations when transactionMode is all", () => Promise.all(connections.map(async connection => {
        const mymigr: Migration[] = await connection.runMigrations({ transactionMode: "all" });
    
        mymigr.length.should.be.equal(0);
    })));

    it("should be able to run all necessary migrations when transactionMode is each", () => Promise.all(connections.map(async connection => {
        const mymigr: Migration[] = await connection.runMigrations({ transactionMode: "each" });
    
        mymigr.length.should.be.equal(2);
        mymigr[0].name.should.be.equal("CreateUuidExtension1544044606093");
        mymigr[1].name.should.be.equal("CreateUsers1543965157399");
    })));
 });