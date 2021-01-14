import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";

describe("github issues > #3120 Add relation option \"createForeignKeyConstraints\"", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        enabledDrivers: ["postgres"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create foreign key for relation without createForeignKeyConstraints option", () => Promise.all(connections.map(async function(connection) {

        const queryRunner = connection.createQueryRunner();
        const mainTable = await queryRunner.getTable("person");
        const joinTable = await queryRunner.getTable("person_addresses_address");
        await queryRunner.release();

        expect(mainTable!.foreignKeys.length).to.be.equal(2);
        expect(joinTable!.foreignKeys.length).to.be.equal(2);

    })));
    
    it("should not create foreign key for relation with createForeignKeyConstraints equal false", () => Promise.all(connections.map(async function(connection) {

        const queryRunner = connection.createQueryRunner();
        const mainTable = await queryRunner.getTable("action_log");
        const joinTable = await queryRunner.getTable("action_log_addresses_address");
        await queryRunner.release();

        expect(mainTable!.foreignKeys.length).to.be.equal(0);
        expect(joinTable!.foreignKeys.length).to.be.equal(0);

    })));

});
