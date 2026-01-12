import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"
import { StrictUser } from "./entity/StrictUser"

describe("sqlite strict mode", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["sqlite", "better-sqlite3", "sqljs"],
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create table with STRICT keyword when strict option is enabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should create table without STRICT keyword when strict option is disabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("non_strict_user")

                expect(table).to.not.be.undefined
                expect(table!.strict).to.be.false

                await queryRunner.release()
            }),
        ))

    it("should maintain strict mode after table recreation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table!.strict).to.be.true

                // Change a column to trigger table recreation
                const nameColumn = table!.findColumnByName("name")!
                const changedColumn = nameColumn.clone()
                changedColumn.length = "100"

                await queryRunner.changeColumn(
                    table!,
                    nameColumn,
                    changedColumn,
                )

                const changedTable = await queryRunner.getTable("strict_user")
                await queryRunner.release()

                expect(changedTable!.strict).to.be.true
            }),
        ))

    it("should allow insertion and retrieval of data in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new StrictUser()
                user.name = "John Doe"
                user.age = 30
                user.score = 95.5
                user.description = "A test user"

                await dataSource.manager.save(user)

                const savedUser = await dataSource.manager.findOne(StrictUser, {
                    where: { id: user.id },
                })

                console.log("Saved User:", savedUser)
                expect(savedUser).to.not.be.null
                expect(savedUser!.name).to.equal("John Doe")
                expect(savedUser!.age).to.equal(30)
                expect(savedUser!.score).to.equal(95.5)
                expect(savedUser!.description).to.equal("A test user")
            }),
        ))

    it("should enforce type constraints in strict mode", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // In strict mode, SQLite should enforce type constraints
                // This test verifies that the table is created with STRICT mode
                const queryRunner = dataSource.createQueryRunner()

                // Get the CREATE TABLE statement
                const table = await queryRunner.getTable("strict_user")
                expect(table!.strict).to.be.true

                await queryRunner.release()
            }),
        ))

    it("should convert common types to strict-compatible types", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("strict_user")

                expect(table).to.not.be.undefined

                // Verify that varchar was converted to text
                const nameColumn = table!.findColumnByName("name")
                expect(nameColumn).to.not.be.undefined
                expect(nameColumn!.type).to.equal("text")

                // Verify int was converted to integer
                const ageColumn = table!.findColumnByName("age")
                expect(ageColumn).to.not.be.undefined
                expect(ageColumn!.type).to.equal("integer")

                // Verify float/double was converted to real
                const scoreColumn = table!.findColumnByName("score")
                expect(scoreColumn).to.not.be.undefined
                expect(scoreColumn!.type).to.equal("real")

                await queryRunner.release()
            }),
        ))
})
