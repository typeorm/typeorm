import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import { QueryRunner, TableIndex } from "../../../src";
import { expect } from "chai";

const questionName = "question";
const categoryName = "category";

const createTables = async (queryRunner: QueryRunner, dbName: string) => {
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
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: false,
            dropSchema: false,
        });

        for (const connection of connections) {
            const queryRunner = connection.createQueryRunner();
            await createTables(queryRunner, String(connection.driver.database));
            await queryRunner.createDatabase("test2", true);
            await createTables(queryRunner, "test2");
            await queryRunner.release();
        };
    });

    after(async () => {
        for (const connection of connections) {
            const queryRunner = connection.createQueryRunner();
            await queryRunner.dropDatabase("test2");
            await queryRunner.release();
        };

        await closeTestingConnections(connections);
    });

    it("should load foreign keys and indices correctly just as it did before the change, the performance improvement shouldn't affect the result",
      () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const tables = await queryRunner.getTables([questionName, categoryName]);

        const questionTable = tables.find(table => table.name === questionName) as Table;
        const categoryTable = tables.find(table => table.name === categoryName) as Table;

        queryRunner.release();

        expect(questionTable.indices.length).to.eq(2);

        const questionNameIndex = questionTable.indices.find(index => index.name === "IDX_QUESTION_NAME") as TableIndex;
        const questionTypeIndex = questionTable.indices.find(index => index.name === "IDX_QUESTION_TYPE") as TableIndex;

        expect(questionNameIndex.columnNames.length).to.eq(1);
        expect(questionNameIndex.columnNames[0]).to.eq("name");
        expect(questionTypeIndex.columnNames.length).to.eq(1);
        expect(questionTypeIndex.columnNames[0]).to.eq("type");

        expect(questionTable.foreignKeys.length).to.eq(0);

        expect(categoryTable.indices.length).to.eq(1);
        expect(categoryTable.indices[0].name).to.eq("IDX_CATEGORY_NAME");
        expect(categoryTable.indices[0].columnNames.length).to.eq(1);
        expect(categoryTable.indices[0].columnNames[0]).to.eq("name");

        expect(categoryTable.foreignKeys.length).to.eq(1);
        expect(categoryTable.foreignKeys[0].name).to.eq("FK_CATEGORY_QUESTION");
        expect(categoryTable.foreignKeys[0].columnNames.length).to.eq(1);
        expect(categoryTable.foreignKeys[0].columnNames[0]).to.eq("questionId");
    })));
});
