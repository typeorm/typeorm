import {expect} from "chai";
import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";
import {TableColumn} from "../../../src/schema-builder/table/TableColumn";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("query runner > add column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly add column and revert add", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        let column1 = new TableColumn({
            name: "secondId",
            type: "int",
            isUnique: true,
            isNullable: false
        });

        // CockroachDB does not support altering primary key constraint
        if (!(connection.driver instanceof CockroachDriver))
            column1.isPrimary = true;

        // MySql and Sqlite does not supports autoincrement composite primary keys.
        if (!(connection.driver instanceof MysqlDriver) && !(connection.driver instanceof AbstractSqliteDriver) && !(connection.driver instanceof CockroachDriver)) {
            column1.isGenerated = true;
            column1.generationStrategy = "increment";
        }

        let column2 = new TableColumn({
            name: "description",
            type: "varchar",
            length: "100",
            default: "'this is description'"
        });

        await queryRunner.addColumn(table!, column1);
        await queryRunner.addColumn("post", column2);

        table = await queryRunner.getTable("post");
        column1 = table!.findColumnByName("secondId")!;
        column1!.should.be.exist;
        column1!.isUnique.should.be.true;
        column1!.isNullable.should.be.false;

        // CockroachDB does not support altering primary key constraint
        if (!(connection.driver instanceof CockroachDriver))
            column1!.isPrimary.should.be.true;

        // MySql and Sqlite does not supports autoincrement composite primary keys.
        if (!(connection.driver instanceof MysqlDriver) && !(connection.driver instanceof AbstractSqliteDriver) && !(connection.driver instanceof CockroachDriver)) {
            column1!.isGenerated.should.be.true;
            column1!.generationStrategy!.should.be.equal("increment");
        }

        column2 = table!.findColumnByName("description")!;
        column2.should.be.exist;
        column2.length.should.be.equal("100");
        column2!.default!.should.be.equal("'this is description'");

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("secondId")).to.be.undefined;
        expect(table!.findColumnByName("description")).to.be.undefined;

        await queryRunner.release();
    })));

});
