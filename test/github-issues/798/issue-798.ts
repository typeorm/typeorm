import "reflect-metadata";
import * as assert from "assert";
import {createConnection, getConnectionOptions} from "../../../src/index";
import {Connection} from "../../../src/connection/Connection";
import { createTestingConnections, closeTestingConnections } from "../../utils/test-utils";

describe("github issues > #798 sqlite: 'database' path in ormconfig.json is not relative", () => {
    let connections: Connection[];
    const oldCwd = process.cwd();

    before(function () {
        process.chdir("..");
    });
    before(async () => connections = await createTestingConnections({ __dirname, enabledDrivers: ["sqlite"] }));

    after(function () {
        process.chdir(oldCwd);
    });

    after(() => closeTestingConnections(connections));

    it("should find the sqlite database if the cwd is changed", () => Promise.all(connections.map(async connection => {
        const options = await getConnectionOptions("sqlite");
        connection = await createConnection({
            ...options,
            name: "sqlite-github798"
        });

        assert.strictEqual(connection.isConnected, true);
    })));

});