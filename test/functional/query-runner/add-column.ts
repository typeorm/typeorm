import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";
import {TableColumn} from "../../../src/schema-builder/table/TableColumn";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {SpannerDriver} from "../../../src/driver/spanner/SpannerDriver";
import {expect} from "chai";

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

        let numericType = "int"
        if (connection.driver instanceof AbstractSqliteDriver) {
            numericType = "integer"
        } else if (connection.driver instanceof SpannerDriver) {
            numericType = "int64"
        }

        let stringType = "varchar"
        if (connection.driver instanceof SpannerDriver) {
            stringType = "string"
        }

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        let column1 = new TableColumn({
            name: "secondId",
            type: numericType,
            isUnique: true,
            isNullable: connection.driver instanceof SpannerDriver
        });

        // CockroachDB and Spanner does not support altering primary key constraint
        if (!(connection.driver instanceof CockroachDriver || connection.driver instanceof SpannerDriver))
            column1.isPrimary = true;

        // MySql, CockroachDB and Sqlite does not supports autoincrement composite primary keys.
        // Spanner does not support autoincrement.
        if (!(connection.driver instanceof MysqlDriver || connection.driver instanceof AbstractSqliteDriver
            || connection.driver instanceof CockroachDriver || connection.driver instanceof SpannerDriver)) {
            column1.isGenerated = true;
            column1.generationStrategy = "increment";
        }

        let column2 = new TableColumn({
            name: "description",
            type: stringType,
            length: "100",
            default: "'this is description'",
            isNullable: connection.driver instanceof SpannerDriver
        });

        let column3 = new TableColumn({
            name: "textAndTag",
            type: stringType,
            length: "200",
            generatedType: "STORED",
            asExpression: "text || tag",
            isNullable: connection.driver instanceof SpannerDriver
        });

        let column4 = new TableColumn({
            name: "textAndTag2",
            type: "varchar",
            length: "200",
            generatedType: "VIRTUAL",
            asExpression: "text || tag",
            isNullable: connection.driver instanceof SpannerDriver
        });

        await queryRunner.addColumn(table!, column1);
        await queryRunner.addColumn("post", column2);

        table = await queryRunner.getTable("post");
        column1 = table!.findColumnByName("secondId")!;
        column1!.should.be.exist;
        column1!.isUnique.should.be.true;
        if (connection.driver instanceof SpannerDriver) {
            column1!.isNullable.should.be.true;
        } else {
            column1!.isNullable.should.be.false;
        }

        // CockroachDB and Spanner does not support altering primary key constraint
        if (!(connection.driver instanceof CockroachDriver || connection.driver instanceof SpannerDriver))
            column1!.isPrimary.should.be.true;

        // MySql, CockroachDB and Sqlite does not supports autoincrement composite primary keys.
        // Spanner does not support autoincrement.
        if (!(connection.driver instanceof MysqlDriver || connection.driver instanceof AbstractSqliteDriver
            || connection.driver instanceof CockroachDriver || connection.driver instanceof SpannerDriver)) {
            column1!.isGenerated.should.be.true;
            column1!.generationStrategy!.should.be.equal("increment");
        }

        column2 = table!.findColumnByName("description")!;
        column2.should.be.exist;
        column2.length.should.be.equal("100");

        // Spanner does not support DEFAULT
        if (!(connection.driver instanceof SpannerDriver)) {
            column2!.default!.should.be.equal("'this is description'");
        }

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof PostgresDriver) {
            const isMySQL = connection.driver instanceof MysqlDriver && connection.options.type === "mysql";
            let postgresSupported = false;

            if (connection.driver instanceof PostgresDriver) {
                postgresSupported = connection.driver.isGeneratedColumnsSupported;
            }

            if (isMySQL || postgresSupported) {
                await queryRunner.addColumn(table!, column3);
                table = await queryRunner.getTable("post");
                column3 = table!.findColumnByName("textAndTag")!;
                column3.should.be.exist;
                column3!.generatedType!.should.be.equals("STORED");
                column3!.asExpression!.should.be.a("string");

                if (connection.driver instanceof MysqlDriver) {
                    await queryRunner.addColumn(table!, column4);
                    table = await queryRunner.getTable("post");
                    column4 = table!.findColumnByName("textAndTag2")!;
                    column4.should.be.exist;
                    column4!.generatedType!.should.be.equals("VIRTUAL");
                    column4!.asExpression!.should.be.a("string");
                }
            }
        }

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("secondId")).to.be.undefined;
        expect(table!.findColumnByName("description")).to.be.undefined;

        await queryRunner.release();
    })));

});
