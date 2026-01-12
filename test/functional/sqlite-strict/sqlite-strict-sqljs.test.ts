import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { Product } from "./entity/Product"
import { StrictUser } from "./entity/StrictUser"

describe("sqljs driver > strict mode", () => {
    describe("with connection-level strict=true", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product, StrictUser],
                    schemaCreate: true,
                    dropSchema: true,
                    enabledDrivers: ["sqljs"],
                    driverSpecific: {
                        strict: true,
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should apply strict mode to all entities", () =>
            Promise.all(
                connections.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const productTable = await queryRunner.getTable("product")
                    const strictUserTable =
                        await queryRunner.getTable("strict_user")
                    await queryRunner.release()

                    expect(productTable).not.to.be.undefined
                    expect(productTable!.strict).to.be.true

                    expect(strictUserTable).not.to.be.undefined
                    expect(strictUserTable!.strict).to.be.true
                }),
            ))

        it("should convert types to strict-compatible types", () =>
            Promise.all(
                connections.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const productTable = await queryRunner.getTable("product")
                    await queryRunner.release()

                    expect(productTable).not.to.be.undefined
                    // varchar should be converted to text in strict mode
                    const nameColumn = productTable!.findColumnByName("name")
                    expect(nameColumn).not.to.be.undefined
                    expect(nameColumn!.type).to.equal("text")
                }),
            ))

        it("should allow data operations in strict mode", () =>
            Promise.all(
                connections.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Product)
                    const product = new Product()
                    product.name = "Test Product"
                    product.price = 100

                    await repository.save(product)

                    const savedProduct = await repository.findOneBy({
                        name: "Test Product",
                    })

                    expect(savedProduct).not.to.be.null
                    expect(savedProduct!.name).to.equal("Test Product")
                    expect(savedProduct!.price).to.equal(100)
                }),
            ))
    })

    describe("with connection-level strict=false", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product, StrictUser],
                    schemaCreate: true,
                    dropSchema: true,
                    enabledDrivers: ["sqljs"],
                    driverSpecific: {
                        strict: false,
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should not apply strict mode when explicitly disabled", () =>
            Promise.all(
                connections.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const productTable = await queryRunner.getTable("product")
                    await queryRunner.release()

                    expect(productTable).not.to.be.undefined
                    expect(productTable!.strict).to.be.false
                }),
            ))

        it("should allow entity-level override", () =>
            Promise.all(
                connections.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const strictUserTable =
                        await queryRunner.getTable("strict_user")
                    await queryRunner.release()

                    expect(strictUserTable).not.to.be.undefined
                    // StrictUser has @Entity({ strict: true })
                    expect(strictUserTable!.strict).to.be.true
                }),
            ))
    })

    describe("without strict option", () => {
        let connections: DataSource[]
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product, StrictUser],
                    schemaCreate: true,
                    dropSchema: true,
                    enabledDrivers: ["sqljs"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should default to non-strict mode", () =>
            Promise.all(
                connections.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const productTable = await queryRunner.getTable("product")
                    await queryRunner.release()

                    expect(productTable).not.to.be.undefined
                    expect(productTable!.strict).to.be.false
                }),
            ))

        it("should honor entity-level strict=true", () =>
            Promise.all(
                connections.map(async (dataSource) => {
                    const queryRunner = dataSource.createQueryRunner()
                    const strictUserTable =
                        await queryRunner.getTable("strict_user")
                    await queryRunner.release()

                    expect(strictUserTable).not.to.be.undefined
                    expect(strictUserTable!.strict).to.be.true
                }),
            ))
    })
})
