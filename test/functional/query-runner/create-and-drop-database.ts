import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";

describe("query runner > create and drop database", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql", "mssql"],
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create and drop database and revert it", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        await queryRunner.createDatabase("myTestDatabase", true);
        let hasDatabase = await queryRunner.hasDatabase("myTestDatabase");
        hasDatabase.should.be.true;

        await queryRunner.dropDatabase("myTestDatabase");
        hasDatabase = await queryRunner.hasDatabase("myTestDatabase");
        hasDatabase.should.be.false;

        await queryRunner.executeMemoryDownSql();

        hasDatabase = await queryRunner.hasDatabase("myTestDatabase");
        hasDatabase.should.be.false;

        await queryRunner.release();
    })));

});
