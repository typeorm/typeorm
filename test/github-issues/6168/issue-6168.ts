import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Table } from "../../../src/schema-builder/table/Table"
import { QueryRunner } from "../../../src"
import { expect } from "chai"

const questionName = "question"
const categoryName = "category"

const createTables = async (queryRunner: QueryRunner, dbName: string) => {
    const questionTableName = `${dbName}.${questionName}`
    const categoryTableName = `${dbName}.${categoryName}`

    await queryRunner.createTable(
        new Table({
            name: questionTableName,
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    name: "name",
                    type: "varchar",
                },
            ],
        }),
        true,
    )

    await queryRunner.createTable(
        new Table({
            name: categoryTableName,
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment",
                },
                {
                    name: "questionId",
                    type: "int",
                },
            ],
            foreignKeys: [
                {
                    columnNames: ["questionId"],
                    referencedTableName: questionTableName,
                    referencedColumnNames: ["id"],
                    name: "FK_CATEGORY_QUESTION",
                },
            ],
        }),
        true,
    )
}

describe("github issues > #6168 fix multiple foreign keys with the same name in a mysql multi-tenanted DB", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: false,
            dropSchema: false,
        })

        await reloadTestingDatabases(connections)

        for (const connection of connections) {
            const queryRunner = connection.createQueryRunner()
            await createTables(queryRunner, String(connection.driver.database))
            await queryRunner.createDatabase("test2", true)
            await createTables(queryRunner, "test2")
            await queryRunner.release()
        }
    })

    after(async () => {
        for (const connection of connections) {
            const queryRunner = connection.createQueryRunner()
            await queryRunner.dropDatabase("test2")
            await queryRunner.release()
        }

        await closeTestingConnections(connections)
    })

    it("should only have one foreign key column", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const tables = await queryRunner.getTables([
                    questionName,
                    categoryName,
                ])

                const questionTable = tables.find(
                    (table) => table.name === questionName,
                ) as Table
                const categoryTable = tables.find(
                    (table) => table.name === categoryName,
                ) as Table

                queryRunner.release()

                expect(categoryTable.foreignKeys.length).to.eq(1)
                expect(categoryTable.foreignKeys[0].name).to.eq(
                    "FK_CATEGORY_QUESTION",
                )
                expect(categoryTable.foreignKeys[0].columnNames.length).to.eq(1) // before the fix this was 2, one for each schema
                expect(categoryTable.foreignKeys[0].columnNames[0]).to.eq(
                    "questionId",
                )

                expect(questionTable.foreignKeys.length).to.eq(0)
            }),
        ))
})
