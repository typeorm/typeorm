import "reflect-metadata";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Table} from "../../../src";
import {TableCheck} from "../../../src/schema-builder/table/TableCheck";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";

describe("query runner > create check constraint", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create check constraint and revert creation", () => Promise.all(connections.map(async connection => {

        // Mysql does not support check constraints.
        if (connection.driver instanceof MysqlDriver)
            return;

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
                },
                {
                    name: "version",
                    type: "int",
                }
            ]
        }), true);

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        const driver = connection.driver;
        const check1 = new TableCheck({ expression: `${driver.escape("name")} <> 'asd' AND ${driver.escape("description")} <> 'test'` });
        const check2 = new TableCheck({ expression: `(${driver.escape("id")} < 0 AND ${driver.escape("version")} < 9999) OR (${driver.escape("id")} > 9999 AND ${driver.escape("version")} < 888)` });
        const check3 = new TableCheck({ expression: `${driver.escape("id")} + ${driver.escape("version")} > 0` });
        await queryRunner.createCheckConstraints("question", [check1, check2, check3]);

        let table = await queryRunner.getTable("question");
        table!.checks.length.should.be.equal(3);

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("question");
        table!.checks.length.should.be.equal(0);

        await queryRunner.release();
    })));

});
