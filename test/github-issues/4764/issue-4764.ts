import "reflect-metadata";
import { Connection } from "../../../src/index";
import {
    reloadTestingDatabases,
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils";
import { expect } from "chai";
import { Cart } from "./entity/Cart";
import { AdminUser } from "./entity/AdminUser";

describe("mssql > add with(nolock) on select with join", () => {
    describe("mssql", () => {
        // -------------------------------------------------------------------------
        // Configuration
        // -------------------------------------------------------------------------

        // connect to db
        let mssqlConnection: Connection;

        before(
            async () =>
                ([mssqlConnection] = await createTestingConnections({
                    enabledDrivers: ["mssql"],
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                }))
        );
        beforeEach(() => reloadTestingDatabases([mssqlConnection]));
        after(() => closeTestingConnections([mssqlConnection]));

        // -------------------------------------------------------------------------
        // Specifications
        // -------------------------------------------------------------------------
        it("should not have Lock clause", async () => {
            const lock = " WITH (NOLOCK)";
            const selectQuery = mssqlConnection
                .createQueryBuilder()
                .select("cart")
                .from(Cart, "cart")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).not.to.equal(true);

            await mssqlConnection.query(selectQuery);
        });

        it("should have WITH (NOLOCK) clause", async () => {
            const lock = " WITH (NOLOCK)";
            const selectQuery = mssqlConnection
                .createQueryBuilder()
                .select("cart")
                .from(Cart, "cart")
                .setLock("dirty_read")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).to.equal(true);

            await mssqlConnection.query(selectQuery);
        });

        it("should have two WITH (NOLOCK) clause", async () => {
            const lock = " WITH (NOLOCK)";
            const selectQuery = mssqlConnection
                .createQueryBuilder()
                .select("cart")
                .from(Cart, "cart")
                .innerJoinAndSelect("cart.CartItems", "cartItems")
                .setLock("dirty_read")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(countInstances(selectQuery, lock)).to.equal(2);

            await mssqlConnection.query(selectQuery);
        });

        it("should have WITH (HOLDLOCK, ROWLOCK) clause", async () => {
            const lock = " WITH (HOLDLOCK, ROWLOCK)";
            const selectQuery = mssqlConnection
                .createQueryBuilder()
                .select("cart")
                .from(Cart, "cart")
                .setLock("pessimistic_read")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).to.equal(true);

            await mssqlConnection.query(selectQuery);
        });

        it("should have WITH (UPLOCK, ROWLOCK) clause", async () => {
            const lock = " WITH (UPDLOCK, ROWLOCK)";
            const selectQuery = mssqlConnection
                .createQueryBuilder()
                .select("cart")
                .from(Cart, "cart")
                .setLock("pessimistic_write")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).to.equal(true);

            await mssqlConnection.query(selectQuery);
        });

        it("should have two WITH (UPDLOCK, ROWLOCK) clause", async () => {
            const lock = " WITH (UPDLOCK, ROWLOCK)";
            const selectQuery = mssqlConnection
                .createQueryBuilder()
                .select("cart")
                .from(Cart, "cart")
                .innerJoinAndSelect("cart.CartItems", "cartItems")
                .setLock("pessimistic_write")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(countInstances(selectQuery, lock)).to.equal(2);

            await mssqlConnection.query(selectQuery);
        });

        function countInstances(str: string, word: string) {
            return str.split(word).length - 1;
        }
    });

    describe("postgres", () => {
        // -------------------------------------------------------------------------
        // Configuration
        // -------------------------------------------------------------------------

        // connect to db
        let postgresConnection: Connection;

        it("should not have WITH (NOLOCK) clause", async () => {
            const lock = " WITH (NOLOCK)";
            const selectQuery = postgresConnection
                .createQueryBuilder()
                .select("admin")
                .from(AdminUser, "admin")
                .setLock("dirty_read")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).not.to.equal(true);

            await postgresConnection.query(selectQuery);
        });

        it("should not have Lock clause", async () => {
            const lock = " WITH (NOLOCK)";
            const selectQuery = postgresConnection
                .createQueryBuilder()
                .select("admin")
                .from(AdminUser, "admin")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).not.to.equal(true);

            await postgresConnection.query(selectQuery);
        });

        it("should not have WITH (HOLDLOCK, ROWLOCK) clause", async () => {
            const lock = " WITH (HOLDLOCK, ROWLOCK)";
            const selectQuery = postgresConnection
                .createQueryBuilder()
                .select("admin")
                .from(AdminUser, "admin")
                .setLock("pessimistic_read")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).not.to.equal(true);

            await postgresConnection.query(selectQuery);
        });

        it("should not have WITH (UPLOCK, ROWLOCK) clause", async () => {
            const lock = " WITH (UPDLOCK, ROWLOCK)";
            const selectQuery = postgresConnection
                .createQueryBuilder()
                .select("admin")
                .from(AdminUser, "admin")
                .setLock("pessimistic_write")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).not.to.equal(true);

            await postgresConnection.query(selectQuery);
        });
        it("should have  FOR SHARE clause", async () => {
            const lock = " FOR SHARE";
            const selectQuery = postgresConnection
                .createQueryBuilder()
                .select("admin")
                .from(AdminUser, "admin")
                .setLock("pessimistic_read")
                .where("1=1")
                .getQuery();

            console.log(selectQuery);
            expect(selectQuery.includes(lock)).to.equal(true);

            await postgresConnection.query(selectQuery);
        });
    });
});
