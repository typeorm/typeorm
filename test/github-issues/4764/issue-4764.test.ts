import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/index"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"
import { Cart } from "./entity/Cart"
import { CartItems } from "./entity/CartItems"

describe("mssql > add lock clause for MSSQL select with join clause", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: DataSource[]

    beforeAll(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["mssql"],
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    afterAll(() => closeTestingConnections(connections))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("should not have Lock clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .where("1=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(selectQuery.includes(lock)).not.to.equal(true)

                await connection.query(selectQuery)
            }),
        ))

    it("should have WITH (NOLOCK) clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .setLock("dirty_read")
                    .where("1=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(selectQuery.includes(lock)).to.equal(true)

                await connection.query(selectQuery)
            }),
        ))

    it("should have two WITH (NOLOCK) clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .innerJoinAndSelect("cart.CartItems", "cartItems")
                    .setLock("dirty_read")
                    .where("1=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(countInstances(selectQuery, lock)).to.equal(2)

                await connection.query(selectQuery)
            }),
        ))

    it("should have three WITH (NOLOCK) clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .innerJoinAndSelect("cart.User", "user")
                    .innerJoinAndSelect("cart.CartItems", "cartItems")
                    .setLock("dirty_read")
                    .where("1=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(countInstances(selectQuery, lock)).to.equal(3)

                await connection.query(selectQuery)
            }),
        ))

    it("should have three WITH (NOLOCK) clause (without relation)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .innerJoin(User, "user", "user.ID=cart.UNID")
                    .innerJoin(
                        CartItems,
                        "cartItems",
                        "cart.ID=cartItems.CartID",
                    )
                    .setLock("dirty_read")
                    .where("cart.ID=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(countInstances(selectQuery, lock)).to.equal(3)

                await connection.query(selectQuery)
            }),
        ))

    it("should have WITH (HOLDLOCK, ROWLOCK) clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (HOLDLOCK, ROWLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .setLock("pessimistic_read")
                    .where("1=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(selectQuery.includes(lock)).to.equal(true)

                await connection.query(selectQuery)
            }),
        ))

    it("should have WITH (UPLOCK, ROWLOCK) clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (UPDLOCK, ROWLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .setLock("pessimistic_write")
                    .where("1=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(selectQuery.includes(lock)).to.equal(true)

                await connection.query(selectQuery)
            }),
        ))

    it("should have two WITH (UPDLOCK, ROWLOCK) clause", () =>
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (UPDLOCK, ROWLOCK)"
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .innerJoinAndSelect("cart.CartItems", "cartItems")
                    .setLock("pessimistic_write")
                    .where("1=1")
                    .getQuery()

                // console.log(selectQuery)
                expect(countInstances(selectQuery, lock)).to.equal(2)

                await connection.query(selectQuery)
            }),
        ))

    function countInstances(str: string, word: string) {
        return str.split(word).length - 1
    }
})
