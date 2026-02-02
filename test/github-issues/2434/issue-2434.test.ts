import "reflect-metadata"
import { DataSource } from "../../../src"
import { Post } from "./entity/Post"
import { Item } from "./entity/Item"
import {
    closeTestingConnections,
    reloadTestingDatabases,
    createTestingConnections,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("github issues > #2434 QueryBuilder insert for Oracle failed", () => {
    let connections: DataSource[] = []
    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["oracle"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    it("should insert multiple rows with QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values([{ id: 5, title: "title 1" }, { id: 6 }])
                    .execute()
                expect(result.raw).to.be.equal(2)
                expect(result.identifiers).to.deep.equal([{ id: 5 }, { id: 6 }])
            }),
        ))

    it("should throw ORA-00001 error if constraint violated when inserting multiple rows", () =>
        Promise.all(
            connections.map(async (connection) => {
                try {
                    await connection
                        .createQueryBuilder()
                        .insert()
                        .into(Post)
                        .values([{ id: 6, title: "title 3" }, { id: 6 }])
                        .execute()
                } catch (err) {
                    expect(err.message).to.contain("ORA-00001")
                }
            }),
        ))

    it("should insert multiple rows of entity with generated columns with QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Item)
                    .values([
                        { itemName: "item name 1" },
                        { itemName: "item name 2" },
                    ])
                    .execute()
                expect(result.raw).to.be.equal(2)
                const items = await connection.getRepository(Item).find()
                expect(items.length).to.be.equal(2)
            }),
        ))

    it("should still insert one row with QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Item)
                    .values({ itemName: "item name 20" })
                    .execute()
                expect(result.identifiers.length).to.be.equal(1)
                const items = await connection.getRepository(Item).find()
                expect(items[0].itemName).to.be.equal("item name 20")
            }),
        ))

    it("should still insert multiple rows with save", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.getRepository(Post).save([
                    { id: 8, namedColumn: "test col 1" },
                    { id: 9, title: "title id 9" },
                ])
                expect(result).to.deep.equal([
                    { id: 8, title: null, namedColumn: "test col 1" },
                    { id: 9, title: "title id 9", namedColumn: null },
                ])
            }),
        ))

    it("should still insert one row with save", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection
                    .getRepository(Post)
                    .save({ id: 10 })
                expect(result).to.deep.equal({
                    id: 10,
                    title: null,
                    namedColumn: null,
                })
            }),
        ))
})
