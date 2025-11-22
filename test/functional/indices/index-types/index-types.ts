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
import { User4 } from "./entity/User4"

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

    it("User4 should have 1 index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.getMetadata(User4).indices.length).equal(1)
            }),
        ))

    it("User4 should have 'btree' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                const idxs = connection.getMetadata(User4).indices

                expect(idxs.length).equals(1)

                const idx = idxs[0]

                expect(String(idx.givenColumnNames)).equals(
                    String(["firstName", "lastName"]),
                )
                expect(idx.type === "btree")
            }),
        ))
})

describe("github issues > Add support of 'hash' indexes for postgres", () => {
    it("Should throw an error if index type is set and sqlite does not support index types", async () => {
        const connections = await createTestingConnections({
            entities: [User3],
            enabledDrivers: ["sqlite"],
            schemaCreate: true,
        })

        const isSqlite = connections.length > 0

        if (isSqlite) {
            await closeTestingConnections(connections)
            expect(
                createTestingConnections({
                    entities: [User2],
                    enabledDrivers: ["sqlite"],
                    schemaCreate: true,
                }),
            ).rejectedWith(TypeORMError)
        }
    })
})

describe("github issues > Add support of 'hash' indexes for postgres", () => {
    it("Should throw an error if index type is set and mariadb does not support index types", async () => {
        const connections = await createTestingConnections({
            entities: [User3],
            enabledDrivers: ["mariadb"],
            schemaCreate: true,
        })

        const isMariadb = connections.length > 0

        if (isMariadb) {
            await closeTestingConnections(connections)
            expect(
                createTestingConnections({
                    entities: [User2],
                    enabledDrivers: ["mariadb"],
                    schemaCreate: true,
                }),
            ).rejectedWith(TypeORMError)
        }
    })
})

describe("github issues > Add support of 'hash' indexes for postgres", () => {
    it("Should throw an error if index type is set and mysql does not support index types", async () => {
        const connections = await createTestingConnections({
            entities: [User3],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
        })

        const isMysql = connections.length > 0

        if (isMysql) {
            await closeTestingConnections(connections)
            expect(
                createTestingConnections({
                    entities: [User2],
                    enabledDrivers: ["mysql"],
                    schemaCreate: true,
                }),
            ).rejectedWith(TypeORMError)
        }
    })
})
