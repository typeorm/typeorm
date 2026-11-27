import { expect } from "chai"
import type { DataSource } from "../../../../../src"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../../../utils/test-utils"
import { User } from "../entity/User"
import { User4 } from "../entity/User4"
import { User5 } from "../entity/User5"

describe("indices > index types > postgres", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "./../entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should support 'hash' index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(
                    dataSource
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "hash"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'btree' index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(
                    dataSource
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "btree"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'gist' index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(
                    dataSource
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "gist"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'spgist' index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(
                    dataSource
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "spgist"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'gin' index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(
                    dataSource
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === "gin"),
                ).instanceOf(Object)
            }),
        ))

    it("should support 'brin' index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(
                    dataSource
                        .getMetadata(User)
                        .indices.find((idx) => idx.type === ("brin" as any)),
                ).instanceOf(Object)
            }),
        ))

    it("User should have six indices", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                expect(dataSource.getMetadata(User).indices.length).equal(6)
            }),
        ))

    it("User4 should have 'btree' index", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const idxs = dataSource.getMetadata(User4).indices

                expect(idxs.length).equals(1)

                const idx = idxs[0]

                expect(String(idx.givenColumnNames)).equals(
                    String(["firstName", "lastName"]),
                )
                expect(idx.type === "btree")
            }),
        ))

    it("User5 view indexes should be defined and correct", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const idxs = dataSource.getMetadata(User5).indices

                expect(idxs.length).equals(2)

                expect(idxs.find((idx) => idx.type === "btree")).instanceOf(
                    Object,
                )
                expect(idxs.find((idx) => idx.type === "hash")).instanceOf(
                    Object,
                )
            }),
        ))
})
