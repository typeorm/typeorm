import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import {TableIndex} from "../../../src/schema-builder/table/TableIndex";

describe("query runner > create index", () => {

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

    it("should correctly create index and revert creation", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        await queryRunner.createTable(new Table({
            name: "question",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "description",
                    type: "varchar",
                }
            ]
        }), true);

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        const index = new TableIndex({ columnNames: ["name", "description"] });
        await queryRunner.createIndex("question", index);

        let table = await queryRunner.getTable("question");
        table!.indices.length.should.be.equal(1);

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("question");
        table!.indices.length.should.be.equal(0);

        await queryRunner.release();
    })));

});
