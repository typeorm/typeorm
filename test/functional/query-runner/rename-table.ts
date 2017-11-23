import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";

describe("query runner > rename table", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "mysql", "postgres", "sqlite"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly rename table and revert rename", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        const renamedTable = table!.clone();
        renamedTable.name = "question";

        await queryRunner.renameTable(table!, renamedTable);
        table = await queryRunner.getTable("question");
        table!.should.be.exist;

        await queryRunner.renameTable("question", "user");
        table = await queryRunner.getTable("user");
        table!.should.be.exist;

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.should.be.exist;

        await queryRunner.release();
    })));

});
