import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";

describe("query runner > create and drop schema", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "postgres"],
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create and drop schema and revert it", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        await queryRunner.createSchema("myTestSchema", true);
        let hasSchema = await queryRunner.hasSchema("myTestSchema");
        hasSchema.should.be.true;

        await queryRunner.dropSchema("myTestSchema");
        hasSchema = await queryRunner.hasSchema("myTestSchema");
        hasSchema.should.be.false;

        await queryRunner.executeMemoryDownSql();

        hasSchema = await queryRunner.hasSchema("myTestSchema");
        hasSchema.should.be.false;

        await queryRunner.release();
    })));

});