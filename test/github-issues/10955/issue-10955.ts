import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Foo } from "./entity/Foo"
import { FooWithSpecialChars } from "./entity/FooWithSpecialChars"
import { CreateTableWithMissingValues1719925118381 } from "./migration/1719925118381-create-table-with-missing-values"
import { CreateTableWithExtraValues1719925118382 } from "./migration/1719925118382-create-table-with-extra-values"
import { CreateTableWithDifferentName1719925118382 } from "./migration/1719925118382-create-table-with-different-name"
import { CreateTableWithSpecialCharsMissingValues1719925118383 } from "./migration/1719925118383-create-table-with-special-chars-missing-values"

describe("github issues > #10955 Use ADD VALUE when adding a new enum value", () => {
    let dataSources: DataSource[]

    after(() => closeTestingConnections(dataSources))

    it("should generate migration with add value when value is added", async () => {
        dataSources = await createTestingConnections({
            entities: [Foo],
            migrations: [CreateTableWithMissingValues1719925118381],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const migrationLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                migrationLog.upQueries.length.should.equal(2)
                migrationLog.upQueries[0].query.should.equal(
                    `ALTER TYPE "public"."foo_bar_enum" ADD VALUE 'value2'`,
                )
                migrationLog.upQueries[1].query.should.equal(
                    `ALTER TYPE "public"."foo_bar_enum" ADD VALUE 'value3'`,
                )

                migrationLog.downQueries.length.should.equal(4)
                migrationLog.downQueries[0].query.should.equal(
                    `ALTER TYPE "public"."foo_bar_enum_old" RENAME TO "foo_bar_enum"`,
                )
                migrationLog.downQueries[1].query.should.equal(
                    `DROP TYPE "public"."foo_bar_enum"`,
                )
                migrationLog.downQueries[2].query.should.equal(
                    `ALTER TABLE "foo" ALTER COLUMN "bar" TYPE "public"."foo_bar_enum_old" USING "bar"::"text"::"public"."foo_bar_enum_old"`,
                )
                migrationLog.downQueries[3].query.should.equal(
                    `CREATE TYPE "public"."foo_bar_enum_old" AS ENUM('value1')`,
                )
            }),
        )
    })

    it("should generate migration without add value when value is removed", async () => {
        dataSources = await createTestingConnections({
            entities: [Foo],
            migrations: [CreateTableWithExtraValues1719925118382],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const migrationLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                migrationLog.upQueries.length.should.equal(4)
                migrationLog.upQueries[0].query.should.equal(
                    `ALTER TYPE "public"."foo_bar_enum" RENAME TO "foo_bar_enum_old"`,
                )
                migrationLog.upQueries[1].query.should.equal(
                    `CREATE TYPE "public"."foo_bar_enum" AS ENUM('value1', 'value2', 'value3')`,
                )
                migrationLog.upQueries[2].query.should.equal(
                    `ALTER TABLE "foo" ALTER COLUMN "bar" TYPE "public"."foo_bar_enum" USING "bar"::"text"::"public"."foo_bar_enum"`,
                )
                migrationLog.upQueries[3].query.should.equal(
                    `DROP TYPE "public"."foo_bar_enum_old"`,
                )

                migrationLog.downQueries.length.should.equal(4)
                migrationLog.downQueries[0].query.should.equal(
                    `ALTER TYPE "public"."foo_bar_enum_old" RENAME TO "foo_bar_enum"`,
                )
                migrationLog.downQueries[1].query.should.equal(
                    `DROP TYPE "public"."foo_bar_enum"`,
                )
                migrationLog.downQueries[2].query.should.equal(
                    `ALTER TABLE "foo" ALTER COLUMN "bar" TYPE "public"."foo_bar_enum_old" USING "bar"::"text"::"public"."foo_bar_enum_old"`,
                )
                migrationLog.downQueries[3].query.should.equal(
                    `CREATE TYPE "public"."foo_bar_enum_old" AS ENUM('value1', 'value2', 'value3', 'value4')`,
                )
            }),
        )
    })

    it("should generate migration without add value when enum type is changed", async () => {
        dataSources = await createTestingConnections({
            entities: [Foo],
            migrations: [CreateTableWithDifferentName1719925118382],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const migrationLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                migrationLog.upQueries.length.should.equal(4)
                migrationLog.upQueries[0].query.should.equal(
                    `ALTER TYPE "public"."goo_bar_enum" RENAME TO "goo_bar_enum_old"`,
                )
                migrationLog.upQueries[1].query.should.equal(
                    `CREATE TYPE "public"."foo_bar_enum" AS ENUM('value1', 'value2', 'value3')`,
                )
                migrationLog.upQueries[2].query.should.equal(
                    `ALTER TABLE "foo" ALTER COLUMN "bar" TYPE "public"."foo_bar_enum" USING "bar"::"text"::"public"."foo_bar_enum"`,
                )
                migrationLog.upQueries[3].query.should.equal(
                    `DROP TYPE "public"."goo_bar_enum_old"`,
                )

                migrationLog.downQueries.length.should.equal(4)
                migrationLog.downQueries[0].query.should.equal(
                    `ALTER TYPE "public"."goo_bar_enum_old" RENAME TO "goo_bar_enum"`,
                )
                migrationLog.downQueries[1].query.should.equal(
                    `DROP TYPE "public"."foo_bar_enum"`,
                )
                migrationLog.downQueries[2].query.should.equal(
                    `ALTER TABLE "foo" ALTER COLUMN "bar" TYPE "public"."goo_bar_enum_old" USING "bar"::"text"::"public"."goo_bar_enum_old"`,
                )
                migrationLog.downQueries[3].query.should.equal(
                    `CREATE TYPE "public"."goo_bar_enum_old" AS ENUM('value1', 'value2', 'value3', 'value4')`,
                )
            }),
        )
    })

    it("should properly escape enum values", async () => {
        dataSources = await createTestingConnections({
            entities: [FooWithSpecialChars],
            migrations: [CreateTableWithSpecialCharsMissingValues1719925118383],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["postgres"],
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.runMigrations()

                const migrationLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                migrationLog.upQueries.length.should.equal(1)
                // The expected query should have properly escaped single quotes
                migrationLog.upQueries[0].query.should.equal(
                    `ALTER TYPE "public"."foo_with_special_chars_bar_enum" ADD VALUE 'say ''hello'' there'`,
                )

                migrationLog.downQueries.length.should.equal(4)
                migrationLog.downQueries[0].query.should.equal(
                    `ALTER TYPE "public"."foo_with_special_chars_bar_enum_old" RENAME TO "foo_with_special_chars_bar_enum"`,
                )
                migrationLog.downQueries[1].query.should.equal(
                    `DROP TYPE "public"."foo_with_special_chars_bar_enum"`,
                )
                migrationLog.downQueries[2].query.should.equal(
                    `ALTER TABLE "foo_with_special_chars" ALTER COLUMN "bar" TYPE "public"."foo_with_special_chars_bar_enum_old" USING "bar"::"text"::"public"."foo_with_special_chars_bar_enum_old"`,
                )
                migrationLog.downQueries[3].query.should.equal(
                    `CREATE TYPE "public"."foo_with_special_chars_bar_enum_old" AS ENUM('simple', 'user''s choice')`,
                )
            }),
        )
    })
})
