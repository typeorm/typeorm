import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    reloadTestingDatabases,
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"
import { Product } from "./entity/Product"
import { Category } from "./entity/Category"
import { StrictUser } from "./entity/StrictUser"

describe("sqlite strict mode > entity-level overrides connection-level", () => {
    describe("entity-level strict=false overrides connection-level strict=true", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product, Category],
                    enabledDrivers: ["sqlite", "better-sqlite3"],
                    dropSchema: true,
                    driverSpecific: {
                        strict: true,
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should allow entity-level strict=false to override connection-level strict=true", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Product should be strict (inherits from connection)
                    const productTable = await queryRunner.getTable("product")
                    expect(productTable).to.not.be.undefined
                    expect(productTable!.strict).to.be.true

                    // Category should NOT be strict (entity-level override)
                    const categoryTable = await queryRunner.getTable("category")
                    expect(categoryTable).to.not.be.undefined
                    expect(categoryTable!.strict).to.be.false

                    await queryRunner.release()
                }),
            ))
    })

    describe("entity-level strict=true overrides connection-level strict=false", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product, StrictUser],
                    enabledDrivers: ["sqlite", "better-sqlite3"],
                    dropSchema: true,
                    driverSpecific: {
                        strict: false,
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should allow entity-level strict=true to override connection-level strict=false", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()

                    // Product should NOT be strict (inherits from connection)
                    const productTable = await queryRunner.getTable("product")
                    expect(productTable).to.not.be.undefined
                    expect(productTable!.strict).to.be.false

                    // StrictUser should be strict (entity-level override)
                    const strictUserTable =
                        await queryRunner.getTable("strict_user")
                    expect(strictUserTable).to.not.be.undefined
                    expect(strictUserTable!.strict).to.be.true

                    await queryRunner.release()
                }),
            ))
    })
})
