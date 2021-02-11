import sinon from "sinon";
import { ConnectionOptions, ConnectionOptionsReader, DatabaseType } from "../../../src";
import { setupTestingConnections, createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { CommandUtils } from "../../../src/commands/CommandUtils";
import { MigrationCreateCommand } from "../../../src/commands/MigrationCreateCommand";
import { Post } from "./entity/Post";
import { resultsTemplates } from "./templates/result-templates-create";

describe("github issues > #7253 Allow migration files to be output in Javascript", () => {
    let connectionOptions: ConnectionOptions[];
    let createFileStub: sinon.SinonStub;
    let timerStub: sinon.SinonFakeTimers;
    let getConnectionOptionsStub: sinon.SinonStub;
    let migrationCreateCommand: MigrationCreateCommand;
    let connectionOptionsReader: ConnectionOptionsReader;
    let baseConnectionOptions: ConnectionOptions;

    const enabledDrivers = [
        "mysql",
    ] as DatabaseType[];

    // simulate args: `npm run typeorm migration:run -- -n test-migration -d test-directory`
    const testHandlerArgs = (options: Record<string, any>) => ({
        "$0": "test",
        "_": ["test"],
        "name": "test-migration",
        "dir": "test-directory",
        ...options
    });

    before(async () => {
        // clean out db from any prior tests in case previous state impacts the generated migrations
        const connections = await createTestingConnections({
            entities: [],
            enabledDrivers
        });
        await reloadTestingDatabases(connections);
        await closeTestingConnections(connections);

        connectionOptions = setupTestingConnections({
            entities: [Post],
            enabledDrivers
        });
        connectionOptionsReader = new ConnectionOptionsReader();
        baseConnectionOptions = await connectionOptionsReader.get(connectionOptions[0].name as string);

        migrationCreateCommand = new MigrationCreateCommand();
        createFileStub = sinon.stub(CommandUtils, "createFile");

        timerStub = sinon.useFakeTimers(1610975184784);
    });

    after(async () => {
        timerStub.restore();
        createFileStub.restore();
    });

    beforeEach(async () => {
        getConnectionOptionsStub = sinon.stub(ConnectionOptionsReader.prototype, "get").resolves({
            ...baseConnectionOptions,
            entities: [Post]
        });
    });

    afterEach(async () => {
        getConnectionOptionsStub.restore();
    });

    it("writes regular empty migration file when no option is passed", async () => {
        createFileStub.resetHistory();

        await migrationCreateCommand.handler(testHandlerArgs({
            "connection": connectionOptions[0].name
        }));

        // compare against control test strings in results-templates.ts
        sinon.assert.calledWith(
            createFileStub,
            sinon.match(/test-directory.*test-migration.ts/),
            sinon.match(resultsTemplates.create.control)
        );

        getConnectionOptionsStub.restore();
    });

    it("writes Javascript empty migration file when option is passed", async () => {
        createFileStub.resetHistory();

        await migrationCreateCommand.handler(testHandlerArgs({
            "connection": connectionOptions[0].name,
            "outputJs": true
        }));

        // compare against control test strings in results-templates.ts
        sinon.assert.calledWith(
            createFileStub,
            sinon.match(/test-directory.*test-migration.js/),
            sinon.match(resultsTemplates.create.javascript)
        );

        getConnectionOptionsStub.restore();
    });
});
