import "reflect-metadata"
import { expect } from "chai"

import { User2 } from "./entity/User2"
import { User3 } from "./entity/User3"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { User } from "./entity/User"
import { DataSource, TypeORMError } from "../../../../src"

describe("github issues > Add support of 'hash' indexes for postgres", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                schemaCreate: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should support 'hash' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    connection
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "hash"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'btree' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    connection
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "btree"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'gist' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    connection
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "gist"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'spgist' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    connection
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "spgist"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'gin' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    connection
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "gin"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'brin' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    connection
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === ("brin" as any)),
                ).instanceOf(Object)
            }),
        ))

    it("User should have six indices", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.getMetadata(User).indices.length).equal(6)
            }),
        ))
})

describe("github issues > Add support of 'hash' indexes for postgres", () => {
    const driversToTest = ["sqlite", "mysql", "mariadb"] as const

    driversToTest.forEach((driver) => {
        it(`Should throw an error when using index types on driver: ${driver}`, async () => {
            const connections = await createTestingConnections({
                entities: [User3],
                enabledDrivers: [driver],
                schemaCreate: true,
            })

            // Check if driver is enabled in test environment
            if (connections.length > 0) {
                await closeTestingConnections(connections)

                await expect(
                    createTestingConnections({
                        entities: [User2],
                        enabledDrivers: [driver],
                        schemaCreate: true,
                    }),
                ).to.be.rejectedWith(TypeORMError)
            }
        })
    })
})
