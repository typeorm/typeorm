import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {CockroachDriver} from "../../../src/driver/cockroachdb/CockroachDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {SqlServerDriver} from "../../../src/driver/sqlserver/SqlServerDriver";
import {Table} from "../../../src/schema-builder/table/Table";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";

describe("query runner > rename table", () => {

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

    it("should correctly rename table and revert rename", () => Promise.all(connections.map(async connection => {

        // CockroachDB does not support renaming constraints and removing PK.
        if (connection.driver instanceof CockroachDriver)
            return;

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");

        await queryRunner.renameTable(table!, "question");
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

    it("should correctly rename table with all constraints depend to that table and revert rename", () => Promise.all(connections.map(async connection => {

        // CockroachDB does not support renaming constraints and removing PK.
        if (connection.driver instanceof CockroachDriver)
            return;

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");

        await queryRunner.renameTable(table!, "renamedPost");
        table = await queryRunner.getTable("renamedPost");
        table!.should.be.exist;

        // should successfully drop pk if pk constraint was correctly renamed.
        await queryRunner.dropPrimaryKey(table!);

        // MySql does not support unique constraints
        if (!(connection.driver instanceof MysqlDriver)) {
            const newUniqueConstraintName = connection.namingStrategy.uniqueConstraintName(table!, ["text", "tag"]);
            let tableUnique = table!.uniques.find(unique => {
                return !!unique.columnNames.find(columnName => columnName === "tag");
            });
            tableUnique!.name!.should.be.equal(newUniqueConstraintName);
        }

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.should.be.exist;

        await queryRunner.release();
    })));

    it("should correctly rename table with custom schema and database and all its dependencies and revert rename", () => Promise.all(connections.map(async connection => {

        // CockroachDB does not support renaming constraints and removing PK.
        if (connection.driver instanceof CockroachDriver)
            return;

        const queryRunner = connection.createQueryRunner();
        let table: Table|undefined;

        let questionTableName: string = "question";
        let renamedQuestionTableName: string = "renamedQuestion";
        let categoryTableName: string = "category";
        let renamedCategoryTableName: string = "renamedCategory";

        // create different names to test renaming with custom schema and database.
        if (connection.driver instanceof SqlServerDriver) {
            questionTableName = "testDB.testSchema.question";
            renamedQuestionTableName = "testDB.testSchema.renamedQuestion";
            categoryTableName = "testDB.testSchema.category";
            renamedCategoryTableName = "testDB.testSchema.renamedCategory";
            await queryRunner.createDatabase("testDB", true);
            await queryRunner.createSchema("testDB.testSchema", true);

        } else if (connection.driver instanceof PostgresDriver) {
            questionTableName = "testSchema.question";
            renamedQuestionTableName = "testSchema.renamedQuestion";
            categoryTableName = "testSchema.category";
            renamedCategoryTableName = "testSchema.renamedCategory";
            await queryRunner.createSchema("testSchema", true);

        } else if (connection.driver instanceof MysqlDriver) {
            questionTableName = "testDB.question";
            renamedQuestionTableName = "testDB.renamedQuestion";
            categoryTableName = "testDB.category";
            renamedCategoryTableName = "testDB.renamedCategory";
            await queryRunner.createDatabase("testDB", true);
        }

        await queryRunner.createTable(new Table({
            name: questionTableName,
            columns: [
                {
                    name: "id",
                    type: connection.driver instanceof AbstractSqliteDriver ? "integer" : "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "name",
                    type: "varchar",
                }
            ],
            indices: [{ columnNames: ["name"] }]
        }), true);

        await queryRunner.createTable(new Table({
            name: categoryTableName,
            columns: [
                {
                    name: "id",
                    type: connection.driver instanceof AbstractSqliteDriver ? "integer" : "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "questionId",
                    type: "int",
                    isUnique: true
                }
            ],
            foreignKeys: [
                {
                    columnNames: ["questionId"],
                    referencedTableName: questionTableName,
                    referencedColumnNames: ["id"]
                }
            ]
        }), true);

        // clear sqls in memory to avoid removing tables when down queries executed.
        queryRunner.clearSqlMemory();

        await queryRunner.renameTable(questionTableName, "renamedQuestion");
        table = await queryRunner.getTable(renamedQuestionTableName);
        const newIndexName = connection.namingStrategy.indexName(table!, ["name"]);
        table!.indices[0].name!.should.be.equal(newIndexName);

        await queryRunner.renameTable(categoryTableName, "renamedCategory");
        table = await queryRunner.getTable(renamedCategoryTableName);
        const newForeignKeyName = connection.namingStrategy.foreignKeyName(table!, ["questionId"], "question", ["id"]);
        table!.foreignKeys[0].name!.should.be.equal(newForeignKeyName);

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable(questionTableName);
        table!.should.be.exist;

        table = await queryRunner.getTable(categoryTableName);
        table!.should.be.exist;

        await queryRunner.release();
    })));

});
