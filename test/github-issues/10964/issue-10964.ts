import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "../10964/entity/User"
import { User2 } from "./entity/User2"
import { TypeORMError } from "../../../src"

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

describe("github issues > Add support of 'hash' indexes for postgres", async () => {
    it("Should throw an error if index type is set and driver does not support index types", async () => {
        await expect(
            createTestingConnections({
                entities: [User2],
                enabledDrivers: ["sqlite"],
                schemaCreate: true,
            }),
        ).rejectedWith(TypeORMError)
    })
})
