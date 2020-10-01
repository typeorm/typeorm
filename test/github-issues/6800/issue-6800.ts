import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import { QueryRunner, createConnection } from "../../../src";
import { MysqlConnectionOptions } from "../../../src/driver/mysql/MysqlConnectionOptions";

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
            }
        ],
        indices: [
            {
                columnNames: ["name"],
                name: "IDX_QUESTION_NAME"
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
                isUnique: true
            }
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

describe("github issues > #6800 fix performance and wrong foreign key in mysql multi-tenanted DB", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: false,
            dropSchema: false,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly load foreign keys and indices", () => Promise.all(connections.map(async connection => {

        console.log("here");
        const queryRunner = connection.createQueryRunner();
        await createDB(queryRunner, "test1");
        await createDB(queryRunner, "test2");

        const options = connection.options as MysqlConnectionOptions;

        const connectionTest1 = await createConnection({ ...options, name: "test1", database: "test1" });
        const queryRunnerTest1 = connectionTest1.createQueryRunner();
        const tablesTest1 = await queryRunnerTest1.getTables([questionName, categoryName]);
        console.log(tablesTest1.length);

        await queryRunner.dropDatabase("test1");
        await queryRunner.dropDatabase("test2");
        await queryRunner.release();
    })));

});
