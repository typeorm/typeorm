import "reflect-metadata"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import { DataSource, QueryRunner } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #8273 Adding @Generated('uuid') doesn't update column default in PostgreSQL", () => {
    let connections: DataSource[]
    const getColumnDefault = async (
        queryRunner: QueryRunner,
        columnName: string,
    ): Promise<string | null> => {
        const query =
            `SELECT "column_default"` +
            ` FROM "information_schema"."columns"` +
            ` WHERE "table_schema" = 'public' AND "table_name" = 'user' AND "column_name" = '${columnName}'`
        const res = await queryRunner.query(query)
        return res.length ? res[0]["column_default"] : null
    }
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
                entities: [User],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should add DEFAULT value when @Generated('increment') is added", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("user")
                const column = table!.findColumnByName("increment")!
                const newColumn = column.clone()
                newColumn.isGenerated = true
                newColumn.generationStrategy = "increment"

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(
                    queryRunner,
                    "increment",
                )
                expect(columnDefault).to.equal(
                    "nextval('user_increment_seq'::regclass)",
                )

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(queryRunner, "increment")
                expect(columnDefault).to.null

                await queryRunner.release()
            }),
        ))

    it("should remove DEFAULT value when @Generated('increment') is removed", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("user")
                const column = table!.findColumnByName(
                    "incrementWithGenerated",
                )!
                const newColumn = column.clone()
                newColumn.isGenerated = false
                newColumn.generationStrategy = undefined

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(
                    queryRunner,
                    "incrementWithGenerated",
                )
                expect(columnDefault).to.null

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(
                    queryRunner,
                    "incrementWithGenerated",
                )
                expect(columnDefault).to.equal(
                    `nextval('"user_incrementWithGenerated_seq"'::regclass)`,
                )

                await queryRunner.release()
            }),
        ))

    it("should add DEFAULT value when @Generated('uuid') is added", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("user")
                const column = table!.findColumnByName("uuid")!
                const newColumn = column.clone()
                newColumn.isGenerated = true
                newColumn.generationStrategy = "uuid"

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(queryRunner, "uuid")
                expect(columnDefault).to.equal("uuid_generate_v4()")

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(queryRunner, "uuid")
                expect(columnDefault).to.null

                await queryRunner.release()
            }),
        ))

    it("should remove DEFAULT value when @Generated('uuid') is removed", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("user")
                const column = table!.findColumnByName("uuidWithGenerated")!
                const newColumn = column.clone()
                newColumn.isGenerated = false
                newColumn.generationStrategy = undefined

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(
                    queryRunner,
                    "uuidWithGenerated",
                )
                expect(columnDefault).to.null

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(
                    queryRunner,
                    "uuidWithGenerated",
                )
                expect(columnDefault).to.equal("uuid_generate_v4()")

                await queryRunner.release()
            }),
        ))
})
