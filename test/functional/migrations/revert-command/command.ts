import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import { expect } from "chai";

describe("migrations > revert until command", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        migrations: [__dirname + "/migration/*.js"],
        enabledDrivers: ["postgres", "mysql"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(async () => {
        await reloadTestingDatabases(connections);
        await Promise.all(connections.map(connection => (
            connection.runMigrations()
        )));
    });
    after(() => closeTestingConnections(connections));
    const migrationsNames = [
        "ExampleMigration1568745078665",
        "ExampleMigrationTwo1568745114903",
        "ExampleMigrationThree1568745177634",
        "ExampleMigrationFour1568745235514",
    ];
    it("should revert all migrations until specified one", () => Promise.all(connections.map(async connection => {
        const migrations = await connection.undoMigrationsUntil({
            name: migrationsNames[1],
        }) || [];
        expect(migrations).to.have.lengthOf(2);
        expect(migrations[0]).to.includes({ name: migrationsNames[0] });
        expect(migrations[1]).to.includes({ name: migrationsNames[1] });
    })));
    it("should not do anything if migration not found", () => Promise.all(connections.map(async connection => {
        const migrations = await connection.undoMigrationsUntil({
            name: "fake",
        });
        expect(migrations).to.be.undefined;
    })));
 });
