import sinon from "sinon";
import { Connection, FileLogger } from "../../../src";
import { createTestingConnections, reloadTestingDatabases, closeTestingConnections, TestingOptions } from "../../utils/test-utils";
import { Username } from "./entity/Username";
import { PlatformTools } from "../../../src/platform/PlatformTools";

describe("github issues > #4410 allow custom filepath for FileLogger", () => {
    let connections: Connection[];
    let stub: sinon.SinonStub;

    const testingOptions: TestingOptions = {
        entities: [Username],
        schemaCreate: true,
        dropSchema: true,
    };
    const testQuery = "SELECT COUNT(*) from username;";

    before(() => stub = sinon.stub(PlatformTools, "appendFileSync"));
    beforeEach(() => reloadTestingDatabases(connections));
    afterEach(async () => {
        stub.resetHistory(); await closeTestingConnections(connections);
    });

    describe("when no option is passed", () => {
        before(async () => {
            connections = await createTestingConnections({
                ...testingOptions,
                createLogger: () => new FileLogger("all"),
            });
        });
        it("writes to the base path", async () => 
        Promise.all(connections.map(async (connection) => {
            await connection.query(testQuery);
            sinon.assert.calledWith(
                stub,
                PlatformTools.load("app-root-path").path + "/ormlogs.log",
                sinon.match(testQuery)
            );
        })));
    });

    describe("when logPath option is passed as a file", () => {
        before(async () => {
            connections = await createTestingConnections({
                ...testingOptions,
                createLogger: () => new FileLogger("all", {
                    logPath: "test.log"
                }),
            });
        });
        it("writes to the given filename", async () => 
        Promise.all(connections.map(async (connection) => {
            await connection.query(testQuery);
            sinon.assert.calledWith(
                stub,
                PlatformTools.load("app-root-path").path + "/test.log",
                sinon.match(testQuery)
            );
        })));
    });

    describe("when logPath option is passed as a nested path", () => {
        before(async () => {
            connections = await createTestingConnections({
                ...testingOptions,
                createLogger: () => new FileLogger("all", {
                    logPath: "./test/test.log"
                }),
            });
        });
        it("writes to the given path", () => 
        Promise.all(connections.map(async (connection) => {
            await connection.query(testQuery);
            sinon.assert.calledWith(
                stub,
                PlatformTools.load("app-root-path").path + "/test/test.log",
                sinon.match(testQuery)
            );
        })));
    });
});
