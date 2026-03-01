import "reflect-metadata"

import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

import { DataSource } from "../../../src/data-source/DataSource"
import { afterEach } from "mocha"
import { expect } from "chai"

describe("github issues > #4956 create typeorm_metatable when running migrations.", () => {
    let dataSources: DataSource[]

    afterEach(async () => {
        await closeTestingConnections(dataSources)
    })

    it("should create typeorm_metadata table when running migrations with views", async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            migrations: [__dirname + "/migration/WithView{.js,.ts}"],
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: false,
            dropSchema: true,
        })

        await Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const typeormMetadataTableName = "typeorm_metadata"

                const hasMetadataTable = await queryRunner.hasTable(
                    typeormMetadataTableName,
                )

                expect(hasMetadataTable).to.be.false

                await connection.runMigrations()

                const hasPostMigrationMetadataTable =
                    await queryRunner.hasTable(typeormMetadataTableName)

                expect(hasPostMigrationMetadataTable).to.be.true
            }),
        )
    })

    it("should not create typeorm_metadata table when running migrations if there are no views", async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/Foo{.js,.ts}"],
            migrations: [__dirname + "/migration/WithoutView{.js,.ts}"],
            enabledDrivers: ["mysql", "mariadb"],
            schemaCreate: false,
            dropSchema: true,
        })

        await Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const typeormMetadataTableName = "typeorm_metadata"

                const hasMetadataTable = await queryRunner.hasTable(
                    typeormMetadataTableName,
                )

                expect(hasMetadataTable).to.be.false

                await connection.runMigrations()

                const hasPostMigrationMetadataTable =
                    await queryRunner.hasTable(typeormMetadataTableName)

                expect(hasPostMigrationMetadataTable).to.be.false
            }),
        )
    })
})
