import "reflect-metadata"
import { expect } from "chai"
import { DataSource, QueryRunner } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { User } from "./entity/User"
import { Document } from "./entity/Document"
import { Album } from "./entity/Album"
import { Photo } from "./entity/Photo"

describe("github issues > #5898 Postgres primary key of type uuid: default value migration/sync not working", () => {
    let connections: DataSource[]
    const getColumnDefault = async (
        queryRunner: QueryRunner,
        tableName: string,
        columnName: string,
    ): Promise<string | null> => {
        const query =
            `SELECT "column_default"` +
            ` FROM "information_schema"."columns"` +
            ` WHERE "table_schema" = 'public' AND "table_name" = '${tableName}' AND "column_name" = '${columnName}'`
        const res = await queryRunner.query(query)
        return res.length ? res[0]["column_default"] : null
    }
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
                entities: [User, Document, Album, Photo],
            })),
    )
    after(() => closeTestingConnections(connections))

    it("should add DEFAULT value when @PrimaryGeneratedColumn('increment') is added", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("photo")
                const column = table!.findColumnByName("id")!
                const newColumn = column.clone()
                newColumn.isGenerated = true
                newColumn.generationStrategy = "increment"

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(
                    queryRunner,
                    "photo",
                    "id",
                )
                expect(columnDefault).to.equal(
                    "nextval('photo_id_seq'::regclass)",
                )

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(
                    queryRunner,
                    "photo",
                    "id",
                )
                expect(columnDefault).to.null

                await queryRunner.release()
            }),
        ))

    it("should remove DEFAULT value when @PrimaryGeneratedColumn('increment') is removed", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("album")
                const column = table!.findColumnByName("id")!
                const newColumn = column.clone()
                newColumn.isGenerated = false
                newColumn.generationStrategy = undefined

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(
                    queryRunner,
                    "album",
                    "id",
                )
                expect(columnDefault).to.null

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(
                    queryRunner,
                    "album",
                    "id",
                )
                expect(columnDefault).to.equal(
                    `nextval('album_id_seq'::regclass)`,
                )

                await queryRunner.release()
            }),
        ))

    it("should add DEFAULT value when @PrimaryGeneratedColumn('uuid') is added", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("document")
                const column = table!.findColumnByName("id")!
                const newColumn = column.clone()
                newColumn.isGenerated = true
                newColumn.generationStrategy = "uuid"

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(
                    queryRunner,
                    "document",
                    "id",
                )
                expect(columnDefault).to.equal("uuid_generate_v4()")

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(
                    queryRunner,
                    "document",
                    "id",
                )
                expect(columnDefault).to.null

                await queryRunner.release()
            }),
        ))

    it("should remove DEFAULT value when @PrimaryGeneratedColumn('uuid') is removed", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("user")
                const column = table!.findColumnByName("id")!
                const newColumn = column.clone()
                newColumn.isGenerated = false
                newColumn.generationStrategy = undefined

                await queryRunner.changeColumn(table!, column, newColumn)

                let columnDefault = await getColumnDefault(
                    queryRunner,
                    "user",
                    "id",
                )
                expect(columnDefault).to.null

                await queryRunner.executeMemoryDownSql()

                columnDefault = await getColumnDefault(
                    queryRunner,
                    "user",
                    "id",
                )
                expect(columnDefault).to.equal("uuid_generate_v4()")

                await queryRunner.release()
            }),
        ))
})
