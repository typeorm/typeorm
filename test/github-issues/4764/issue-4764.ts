import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../src/index";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Cart } from "./entity/Cart";

describe("mssql > add lock clause for MSSQL select with join clause", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: Connection[];

    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["mssql"],
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    it("should not have Lock clause", async () => {
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)";
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .where("1=1")
                    .getQuery();

                console.log(selectQuery);
                expect(selectQuery.includes(lock)).not.to.equal(true);

                await connection.query(selectQuery);
            })
        );
    });

    it("should have WITH (NOLOCK) clause", async () => {
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)";
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .setLock("dirty_read")
                    .where("1=1")
                    .getQuery();

                console.log(selectQuery);
                expect(selectQuery.includes(lock)).to.equal(true);

                await connection.query(selectQuery);
            })
        );
    });

    it("should have two WITH (NOLOCK) clause", async () => {
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (NOLOCK)";
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .innerJoinAndSelect("cart.CartItems", "cartItems")
                    .setLock("dirty_read")
                    .where("1=1")
                    .getQuery();

                console.log(selectQuery);
                expect(countInstances(selectQuery, lock)).to.equal(2);

                await connection.query(selectQuery);
            })
        );
    });

    it("should have WITH (HOLDLOCK, ROWLOCK) clause", async () => {
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (HOLDLOCK, ROWLOCK)";
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .setLock("pessimistic_read")
                    .where("1=1")
                    .getQuery();

                console.log(selectQuery);
                expect(selectQuery.includes(lock)).to.equal(true);

                await connection.query(selectQuery);
            })
        );
    });

    it("should have WITH (UPLOCK, ROWLOCK) clause", async () => {
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (UPDLOCK, ROWLOCK)";
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .setLock("pessimistic_write")
                    .where("1=1")
                    .getQuery();

                console.log(selectQuery);
                expect(selectQuery.includes(lock)).to.equal(true);

                await connection.query(selectQuery);
            })
        );
    });

    it("should have two WITH (UPDLOCK, ROWLOCK) clause", async () => {
        Promise.all(
            connections.map(async (connection) => {
                const lock = " WITH (UPDLOCK, ROWLOCK)";
                const selectQuery = connection
                    .createQueryBuilder()
                    .select("cart")
                    .from(Cart, "cart")
                    .innerJoinAndSelect("cart.CartItems", "cartItems")
                    .setLock("pessimistic_write")
                    .where("1=1")
                    .getQuery();

                console.log(selectQuery);
                expect(countInstances(selectQuery, lock)).to.equal(2);

                await connection.query(selectQuery);
            })
        );
    });

    function countInstances(str: string, word: string) {
        return str.split(word).length - 1;
    }
});
