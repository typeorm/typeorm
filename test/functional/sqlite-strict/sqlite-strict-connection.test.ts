import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    reloadTestingDatabases,
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"
import { Product } from "./entity/Product"

describe("sqlite strict mode > connection-level", () => {
    let connections: DataSource[]

    describe("with strict=true", () => {
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product],
                    enabledDrivers: ["sqlite", "better-sqlite3"],
                    dropSchema: true,
                    driverSpecific: {
                        strict: true,
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should apply strict mode from connection options to all entities", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable("product")

                    expect(table).to.not.be.undefined
                    expect(table!.strict).to.be.true

                    await queryRunner.release()
                }),
            ))
    })

    describe("with strict=false", () => {
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product],
                    enabledDrivers: ["sqlite", "better-sqlite3"],
                    dropSchema: true,
                    driverSpecific: {
                        strict: false,
                    },
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should not apply strict mode when connection option is false", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable("product")

                    expect(table).to.not.be.undefined
                    expect(table!.strict).to.be.false

                    await queryRunner.release()
                }),
            ))
    })

    describe("without strict option", () => {
        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [Product],
                    enabledDrivers: ["sqlite", "better-sqlite3"],
                    dropSchema: true,
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))
        after(() => closeTestingConnections(connections))

        it("should not apply strict mode when connection option is not set", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const queryRunner = connection.createQueryRunner()
                    const table = await queryRunner.getTable("product")

                    expect(table).to.not.be.undefined
                    expect(table!.strict).to.be.false

                    await queryRunner.release()
                }),
            ))
    })
})
