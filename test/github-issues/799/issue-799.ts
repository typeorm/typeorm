import "reflect-metadata";
import * as assert from "assert";
import {createConnection} from "../../../src/index";
import * as rimraf from "rimraf";
import {dirname} from "path";
import {Connection} from "../../../src/connection/Connection";
import { createTestingConnections, closeTestingConnections } from "../../utils/test-utils";

describe("github issues > #799 sqlite: 'database' path should be created", () => {
    let connections: Connection[];

    const path = `${__dirname}/tmp/sqlitedb.db`;
    const cleanup = (done: () => void) => {
        rimraf(dirname(path), () => {
            return done();
        });
    };

    before(async () => connections = await createTestingConnections({ __dirname, enabledDrivers: ["sqlite"] }));
    before(cleanup);
    after(cleanup);

    after(() => closeTestingConnections(connections));

    it("should create the whole path to database file", () => Promise.all(connections.map(async connection => {
        connection = await createConnection({
            "name": "sqlite-github799",
            "type": "sqlite",
            "database": path
        });

        assert.strictEqual(connection.isConnected, true);
    })));

});
