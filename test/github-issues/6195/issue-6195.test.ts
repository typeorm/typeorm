import { expect } from "chai"
import "reflect-metadata"

import { DataSource, QueryRunner, Table } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { testColumnName, testTableName } from "./migration/MigrationToFakeRun"

const createTestTable = async (queryRunner: QueryRunner) => {
    await queryRunner.createTable(
        new Table({
            name: testTableName,
            columns: [
                {
                    name: "id",
                    type: "integer",
                    isPrimary: true,
                },
                {
                    name: testColumnName,
                    type: "varchar",
                },
            ],
        }),
    )
}

describe("github issues > #6195 feature: fake migrations for existing tables", () => {
    let dataSources: DataSource[]

    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: false,
            dropSchema: false,
            migrations: [__dirname + "/migration/**/*{.ts,.js}"],
        })

        await reloadTestingDatabases(dataSources)

        for (const dataSource of dataSources) {
            const queryRunner = dataSource.createQueryRunner()
            await dataSource.showMigrations() // To initialize migrations table
            await createTestTable(queryRunner)
            await queryRunner.release()
        }
    })

    afterAll(async () => {
        await closeTestingConnections(dataSources)
    })

    describe("fake run tests", () => {
        it("should fail for duplicate column", async () => {
            for (const dataSource of dataSources) {
                if (dataSource.options.type === "mongodb") return
                await expect(
                    dataSource.runMigrations({ transaction: "all" }),
                ).to.be.rejectedWith(Error)
            }
        })

        it("should not fail for duplicate column when run with the fake option", async () => {
            for (const dataSource of dataSources) {
                if (dataSource.options.type === "mongodb") return
                await expect(
                    dataSource.runMigrations({
                        transaction: "all",
                        fake: true,
                    }),
                ).not.to.be.rejectedWith(Error)
            }
        })
    })

    describe("fake rollback tests", () => {
        beforeAll(async () => {
            for (const dataSource of dataSources) {
                if (dataSource.options.type === "mongodb") return
                await dataSource.runMigrations({
                    transaction: "all",
                    fake: true,
                })
            }
        })

        it("should fail for non-existent column", async () => {
            for (const dataSource of dataSources) {
                if (dataSource.options.type === "mongodb") return
                await expect(
                    dataSource.undoLastMigration({ transaction: "all" }),
                ).to.be.rejectedWith(Error)
            }
        })

        it("should not fail for non-existent column when run with the fake option", async () => {
            for (const dataSource of dataSources) {
                if (dataSource.options.type === "mongodb") return
                await expect(
                    dataSource.undoLastMigration({
                        transaction: "all",
                        fake: true,
                    }),
                ).not.to.be.rejectedWith(Error)
            }
        })
    })
})
