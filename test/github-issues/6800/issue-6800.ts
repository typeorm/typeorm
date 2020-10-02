import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import { QueryRunner, createConnection, TableIndex } from "../../../src";
import { MysqlConnectionOptions } from "../../../src/driver/mysql/MysqlConnectionOptions";
import { expect } from "chai";

const questionName = "question";
const categoryName = "category";

const createDB = async (queryRunner: QueryRunner, dbName: string) => {
    await queryRunner.createDatabase(dbName, true);
    const questionTableName = `${dbName}.${questionName}`;
    const categoryTableName = `${dbName}.${categoryName}`;

    await queryRunner.createTable(new Table({
        name: questionTableName,
        columns: [
            {
                name: "id",
                type: "int",
                isPrimary: true,
                isGenerated: true,
                generationStrategy: "increment"
            },
            {
                name: "name",
                type: "varchar",
            },
            {
              name: "type",
              type: "varchar",
          }
        ],
        indices: [
            {
                columnNames: ["name"],
                name: "IDX_QUESTION_NAME"
            },
            {
              columnNames: ["type"],
              name: "IDX_QUESTION_TYPE"
          }
        ]
    }), true);

    await queryRunner.createTable(new Table({
        name: categoryTableName,
        columns: [
            {
                name: "id",
                type: "int",
                isPrimary: true,
                isGenerated: true,
                generationStrategy: "increment"
            },
            {
                name: "questionId",
                type: "int",
            },
            {
                name: "name",
                type: "int",
            }
        ],
        indices: [
          {
              columnNames: ["name"],
              name: "IDX_CATEGORY_NAME"
          },
        ],
        foreignKeys: [
          {
              columnNames: ["questionId"],
              referencedTableName: questionTableName,
              referencedColumnNames: ["id"],
              name: "FK_CATEGORY_QUESTION"
          }
        ]
    }), true);
};

describe("github issues > #6800 fix foreign key and indices query performance in mysql multi-tenanted DB", () => {

    let connections: Connection[];
    let testConnections = [] as Connection[];
    let testQueryRunners = [] as QueryRunner[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: false,
            dropSchema: false,
        });

        if (connections.length > 0) {
            const queryRunner = connections[0].createQueryRunner();
            await createDB(queryRunner, "test1");
            await createDB(queryRunner, "test2");
            await queryRunner.release();
        };
    });

    beforeEach(() => reloadTestingDatabases(connections));

    after(async () => {
        if (connections.length > 0) {
            const queryRunner = connections[0].createQueryRunner();
            await queryRunner.dropDatabase("test1");
            await queryRunner.dropDatabase("test2");
            await queryRunner.release();
        };

        await closeTestingConnections(connections);
        await Promise.all(testQueryRunners.map(queryRunner => queryRunner.release()));
        await closeTestingConnections(testConnections);
    });

    it("should load foreign keys and indices correctly just as it did before the change, the performance improvement shouldn't affect the result",
      () => Promise.all(connections.map(async connection => {
        const options = connection.options as MysqlConnectionOptions;

        const connectionTest1 = await createConnection({ ...options, name: "test1", database: "test1" });
        testConnections.push(connectionTest1);
        const queryRunnerTest1 = connectionTest1.createQueryRunner();
        testQueryRunners.push(queryRunnerTest1);
        const tables = await queryRunnerTest1.getTables([questionName, categoryName]);

        const questionTable1 = tables.find(table => table.name === questionName) as Table;
        const categoryTable1 = tables.find(table => table.name === categoryName) as Table;

        expect(questionTable1.indices.length).to.eq(2);

        const questionNameIndex = questionTable1.indices.find(index => index.name === "IDX_QUESTION_NAME") as TableIndex;
        const questionTypeIndex = questionTable1.indices.find(index => index.name === "IDX_QUESTION_TYPE") as TableIndex;

        expect(questionNameIndex.columnNames.length).to.eq(1);
        expect(questionNameIndex.columnNames[0]).to.eq("name");
        expect(questionTypeIndex.columnNames.length).to.eq(1);
        expect(questionTypeIndex.columnNames[0]).to.eq("type");
        
        expect(questionTable1.foreignKeys.length).to.eq(0);

        expect(categoryTable1.indices.length).to.eq(1);
        expect(categoryTable1.indices[0].name).to.eq("IDX_CATEGORY_NAME");
        expect(categoryTable1.indices[0].columnNames.length).to.eq(1);
        expect(categoryTable1.indices[0].columnNames[0]).to.eq("name");

        expect(categoryTable1.foreignKeys.length).to.eq(1);
        expect(categoryTable1.foreignKeys[0].name).to.eq("FK_CATEGORY_QUESTION");
        expect(categoryTable1.foreignKeys[0].columnNames.length).to.eq(1);
        expect(categoryTable1.foreignKeys[0].columnNames[0]).to.eq("questionId");
    })));
});
