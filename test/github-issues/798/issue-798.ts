import "reflect-metadata";
import * as assert from "assert";
import {createConnection, getConnectionOptions} from "../../../src/index";
import {Connection} from "../../../src/connection/Connection";
import {getTypeOrmConfig} from "../../utils/test-utils";

describe("github issues > #798 sqlite: 'database' path in ormconfig.json is not relative", () => {
    let connection: Connection;
    const oldCwd = process.cwd();

    before(function () {
        process.chdir("..");
    });

    after(function () {
        process.chdir(oldCwd);
    });

    afterEach(() => {
        if (connection && connection.isConnected) {
            connection.close();
        }
    });

    it("should find the sqlite database if the cwd is changed", async function () {
        // run test only if sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(conf => conf.type === "sqlite" && conf.skip === false);
        if (!isEnabled) return;

        const options = await getConnectionOptions("sqlite");
        connection = await createConnection(options);

        assert.strictEqual(connection.isConnected, true);
    });

    it("should find the sqlite database if the cwd is changed for better-sqlite3", async function () {
        // run test only if sqlite3 is enabled in ormconfig
        const isEnabled = getTypeOrmConfig().some(conf => conf.type === "better-sqlite3" && conf.skip === false);
        if (!isEnabled) return;

        const options = await getConnectionOptions("better-sqlite3");
        connection = await createConnection(options);

        assert.strictEqual(connection.isConnected, true);
    });

});
