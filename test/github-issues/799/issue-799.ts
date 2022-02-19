import "reflect-metadata";
import * as assert from "assert";
import {createConnection} from "../../../src/index";
import rimraf from "rimraf";
import {dirname} from "path";
import {Connection} from "../../../src/connection/Connection";
import {getTypeOrmConfig} from "../../utils/test-utils";

describe("github issues > #799 sqlite: 'database' path should be created", () => {
    let connection: Connection;

    const path = `${__dirname}/tmp/sqlitedb.db`;
    const cleanup = (done: () => void) => {
        rimraf(dirname(path), () => {
            return done();
        });
    };

    before(cleanup);
    after(cleanup);

    afterEach(() => {
        if (connection && connection.isConnected) {
            connection.close();
        }
    });

    it("should create the whole path to database file", async function () {
        // run test only if better-sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(conf => conf.type === "sqlite" && conf.skip === false);
        if (isEnabled === false) return;

        connection = await createConnection({
            "name": "sqlite",
            "type": "sqlite",
            "database": path
        });

        assert.strictEqual(connection.isConnected, true);
    });

    it("should create the whole path to database file for better-sqlite3", async function () {
        // run test only if better-sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(conf => conf.type === "better-sqlite3" && conf.skip === false);
        if (isEnabled === false) return;

        connection = await createConnection({
            "name": "better-sqlite3",
            "type": "better-sqlite3",
            "database": path
        });

        assert.strictEqual(connection.isConnected, true);
    });

});
