import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Foo } from "./entity/Foo"
import { FooView } from "./entity/FooView"

const customTypeormMetadataTableName = "custom_typeorm_metadata_table_name"

describe("github issues > #7266 rename table typeorm_metadata name.", () => {
    let dataSources: DataSource[]

    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Foo, FooView],
                enabledDrivers: ["postgres", "mysql", "mariadb"],
                metadataTableName: customTypeormMetadataTableName,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create the typeorm metadata table with a custom name when provided", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                expect(connection.metadataTableName).to.equal(
                    customTypeormMetadataTableName,
                )

                const hasCustomMetadataTableName = await queryRunner.hasTable(
                    customTypeormMetadataTableName,
                )

                expect(hasCustomMetadataTableName).to.be.true

                const hasDefaultMetadataTableName =
                    await queryRunner.hasTable("typeorm_metadata")

                expect(hasDefaultMetadataTableName).to.be.false

                await queryRunner.release()
            }),
        ))

    it("should have correct views using the custom named metadata table", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                const fooView = await queryRunner.getView("foo_view")

                expect(fooView).to.be.exist

                await queryRunner.release()
            }),
        ))
})
