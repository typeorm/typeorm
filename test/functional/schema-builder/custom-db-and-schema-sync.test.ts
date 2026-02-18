import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../src"
import { ForeignKeyMetadata } from "../../../src/metadata/ForeignKeyMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Album } from "./entity/common/Album"
import { Photo } from "./entity/common/Photo"

describe("schema builder > custom-db-and-schema-sync", () => {
    describe("custom database", () => {
        let connections: DataSource[]
        before(async () => {
            connections = await createTestingConnections({
                entities: [Album, Photo],
                enabledDrivers: ["mysql"],
                dropSchema: true,
            })
        })
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should correctly sync tables with custom schema and database", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const photoMetadata = connection.getMetadata("photo")
                    const albumMetadata = connection.getMetadata("album")

                    // create tables
                    photoMetadata.synchronize = true
                    albumMetadata.synchronize = true

                    photoMetadata.database = "secondDB"
                    photoMetadata.tablePath = "secondDB.photo"

                    albumMetadata.database = "secondDB"
                    albumMetadata.tablePath = "secondDB.album"

                    await queryRunner.createDatabase(
                        photoMetadata.database,
                        true,
                    )

                    await connection.synchronize()

                    // create foreign key
                    const albumTable = await queryRunner.getTable(
                        albumMetadata.tablePath,
                    )
                    let photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )
                    albumTable!.should.be.exist
                    photoTable!.should.be.exist

                    const columns = photoMetadata.columns.filter(
                        (column) => column.propertyName === "albumId",
                    )
                    const referencedColumns = albumMetadata.columns.filter(
                        (column) => column.propertyName === "id",
                    )
                    const fkMetadata = new ForeignKeyMetadata({
                        entityMetadata: photoMetadata,
                        referencedEntityMetadata: albumMetadata,
                        columns: columns,
                        referencedColumns: referencedColumns,
                        namingStrategy: connection.namingStrategy,
                    })
                    photoMetadata.foreignKeys.push(fkMetadata)

                    await connection.synchronize()

                    photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )
                    photoTable!.foreignKeys.length.should.be.equal(1)

                    // drop foreign key
                    photoMetadata.foreignKeys = []
                    await connection.synchronize()

                    // drop tables manually, because they will not synchronize automatically
                    await queryRunner.dropTable(
                        photoMetadata.tablePath,
                        true,
                        false,
                    )
                    await queryRunner.dropTable(
                        albumMetadata.tablePath,
                        true,
                        false,
                    )

                    // drop created database
                    await queryRunner.dropDatabase("secondDB", true)

                    await queryRunner.release()
                }),
            ))
    })

    describe("custom schema", () => {
        let connections: DataSource[]
        before(async () => {
            connections = await createTestingConnections({
                enabledDrivers: ["postgres", "sap"],
                entities: [Album, Photo],
                dropSchema: true,
            })
        })
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should correctly sync tables with custom schema", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const photoMetadata = connection.getMetadata("photo")
                    const albumMetadata = connection.getMetadata("album")

                    // create tables
                    photoMetadata.synchronize = true
                    albumMetadata.synchronize = true

                    photoMetadata.schema = "photo-schema"
                    photoMetadata.tablePath = "photo-schema.photo"

                    albumMetadata.schema = "album-schema"
                    albumMetadata.tablePath = "album-schema.album"

                    await queryRunner.createSchema(photoMetadata.schema, true)
                    await queryRunner.createSchema(albumMetadata.schema, true)

                    await connection.synchronize()

                    // create foreign key
                    const albumTable = await queryRunner.getTable(
                        albumMetadata.tablePath,
                    )
                    let photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )
                    expect(albumTable).to.exist
                    expect(photoTable).to.exist

                    const columns = photoMetadata.columns.filter(
                        (column) => column.propertyName === "albumId",
                    )
                    const referencedColumns = albumMetadata.columns.filter(
                        (column) => column.propertyName === "id",
                    )
                    const fkMetadata = new ForeignKeyMetadata({
                        entityMetadata: photoMetadata,
                        referencedEntityMetadata: albumMetadata,
                        columns: columns,
                        referencedColumns: referencedColumns,
                        namingStrategy: connection.namingStrategy,
                    })
                    photoMetadata.foreignKeys.push(fkMetadata)

                    await connection.synchronize()

                    photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )
                    photoTable!.foreignKeys.length.should.be.equal(1)

                    // drop foreign key
                    photoMetadata.foreignKeys = []
                    await connection.synchronize()

                    // drop tables manually, because they will not synchronize automatically
                    await queryRunner.dropTable(
                        photoMetadata.tablePath,
                        true,
                        false,
                    )
                    await queryRunner.dropTable(
                        albumMetadata.tablePath,
                        true,
                        false,
                    )

                    // drop created database
                    await queryRunner.dropDatabase("secondDB", true)

                    await queryRunner.release()
                }),
            ))

        it("should correctly sync tables with `public` schema", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const photoMetadata = connection.getMetadata("photo")
                    const albumMetadata = connection.getMetadata("album")

                    // create tables
                    photoMetadata.synchronize = true
                    albumMetadata.synchronize = true

                    photoMetadata.schema = "public"
                    photoMetadata.tablePath = "public.photo"

                    albumMetadata.schema = "public"
                    albumMetadata.tablePath = "public.album"

                    await queryRunner.createSchema(photoMetadata.schema, true)
                    await queryRunner.createSchema(albumMetadata.schema, true)

                    await connection.synchronize()

                    // create foreign key
                    const albumTable = await queryRunner.getTable(
                        albumMetadata.tablePath,
                    )
                    let photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )

                    expect(albumTable).to.exist
                    expect(photoTable).to.exist

                    photoTable!.foreignKeys.length.should.be.equal(0)

                    const columns = photoMetadata.columns.filter(
                        (column) => column.propertyName === "albumId",
                    )
                    const referencedColumns = albumMetadata.columns.filter(
                        (column) => column.propertyName === "id",
                    )
                    const fkMetadata = new ForeignKeyMetadata({
                        entityMetadata: photoMetadata,
                        referencedEntityMetadata: albumMetadata,
                        columns: columns,
                        referencedColumns: referencedColumns,
                        namingStrategy: connection.namingStrategy,
                    })

                    photoMetadata.foreignKeys.push(fkMetadata)
                    await connection.synchronize()

                    photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )
                    photoTable!.foreignKeys.length.should.be.equal(1)

                    // drop foreign key
                    photoMetadata.foreignKeys = []
                    await connection.synchronize()

                    // drop tables manually, because they will not synchronize automatically
                    await queryRunner.dropTable(
                        photoMetadata.tablePath,
                        true,
                        false,
                    )
                    await queryRunner.dropTable(
                        albumMetadata.tablePath,
                        true,
                        false,
                    )

                    // drop created database
                    await queryRunner.dropDatabase("secondDB", true)

                    await queryRunner.release()
                }),
            ))
    })

    describe("custom database and schema", () => {
        let connections: DataSource[]
        before(async () => {
            connections = await createTestingConnections({
                entities: [Album, Photo],
                enabledDrivers: ["mssql"],
                dropSchema: true,
            })
        })
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should correctly sync tables with custom schema and database", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const photoMetadata = connection.getMetadata("photo")
                    const albumMetadata = connection.getMetadata("album")

                    // create tables
                    photoMetadata.synchronize = true
                    albumMetadata.synchronize = true

                    photoMetadata.database = "secondDB"
                    photoMetadata.schema = "photo-schema"
                    photoMetadata.tablePath = "secondDB.photo-schema.photo"
                    const photoMetadataSchemaPath = "secondDB.photo-schema"

                    albumMetadata.database = "secondDB"
                    albumMetadata.schema = "album-schema"
                    albumMetadata.tablePath = "secondDB.album-schema.album"
                    const albumMetadataSchemaPath = "secondDB.album-schema"

                    await queryRunner.createDatabase(
                        photoMetadata.database,
                        true,
                    )
                    await queryRunner.createSchema(
                        photoMetadataSchemaPath,
                        true,
                    )
                    await queryRunner.createSchema(
                        albumMetadataSchemaPath,
                        true,
                    )

                    await connection.synchronize()

                    // create foreign key
                    const albumTable = await queryRunner.getTable(
                        albumMetadata.tablePath,
                    )
                    let photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )
                    expect(albumTable).to.exist
                    expect(photoTable).to.exist

                    const columns = photoMetadata.columns.filter(
                        (column) => column.propertyName === "albumId",
                    )
                    const referencedColumns = albumMetadata.columns.filter(
                        (column) => column.propertyName === "id",
                    )
                    const fkMetadata = new ForeignKeyMetadata({
                        entityMetadata: photoMetadata,
                        referencedEntityMetadata: albumMetadata,
                        columns: columns,
                        referencedColumns: referencedColumns,
                        namingStrategy: connection.namingStrategy,
                    })
                    photoMetadata.foreignKeys.push(fkMetadata)

                    await connection.synchronize()

                    photoTable = await queryRunner.getTable(
                        photoMetadata.tablePath,
                    )
                    photoTable!.foreignKeys.length.should.be.equal(1)

                    // drop foreign key
                    photoMetadata.foreignKeys = []
                    await connection.synchronize()

                    // drop tables manually, because they will not synchronize automatically
                    await queryRunner.dropTable(
                        photoMetadata.tablePath,
                        true,
                        false,
                    )
                    await queryRunner.dropTable(
                        albumMetadata.tablePath,
                        true,
                        false,
                    )

                    // drop created database
                    await queryRunner.dropDatabase("secondDB", true)

                    await queryRunner.release()
                }),
            ))
    })
})
