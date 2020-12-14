import sinon from "sinon";
import { ConnectionOptions, ConnectionOptionsReader, DatabaseType } from "../../../../src";
import { setupTestingConnections, createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../../utils/test-utils";
import { CommandUtils } from "../../../../src/commands/CommandUtils";
import { MigrationGenerateCommand } from "../../../../src/commands/MigrationGenerateCommand";
import { Answer } from "./entity/Answer";
import { Category } from "./entity/Category";
import { Post } from "./entity/Post";
import { User } from "./entity/User";

describe("multi-database > migration", () => {
    let connectionOptions: ConnectionOptions[];
    let createFileStub: sinon.SinonStub;
    let getConnectionOptionsStub: sinon.SinonStub;
    let migrationGenerateCommand: MigrationGenerateCommand;
    let connectionOptionsReader: ConnectionOptionsReader;
    let baseConnectionOptions: ConnectionOptions;

    const enabledDrivers = ["sqlite", "better-sqlite3"] as DatabaseType[];

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

        connectionOptions = await setupTestingConnections({
            entities: [Answer, Category, Post, User],
            enabledDrivers
        });
        connectionOptionsReader = new ConnectionOptionsReader();
        migrationGenerateCommand = new MigrationGenerateCommand();
        createFileStub = sinon.stub(CommandUtils, "createFile");
    });
    after(() => createFileStub.restore());

    it("prepends statements for any referenced attachable databases", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory();
            baseConnectionOptions = await connectionOptionsReader.get(connectionOption.name as string);
            getConnectionOptionsStub = sinon.stub(ConnectionOptionsReader.prototype, "get").resolves({
                ...baseConnectionOptions,
                entities: [Answer, Category, Post, User],
            });

            await migrationGenerateCommand.handler(testHandlerArgs({
                "connection": connectionOption.name
            }));

            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.ts/),
            );
            const callLines: string[] = createFileStub.getCall(0).args[1].split(`\n`);
            const upLines = callLines.slice(callLines.findIndex(line => line.match(/.*public async up/))+1);
            sinon.assert.match(upLines[0], /.*ATTACH \".*\/filename-sqlite.db\" AS \"7b1f78d2ff9c3494608bf1f602407e3da4ba4698014f15a2d50710e3c655b05\"/);
            sinon.assert.match(upLines[1], /.*ATTACH \".*\/subdir\/relative-subdir-sqlite.db\" AS \"e1faf903c4c4bd8e9e912734b4923e7398186b89a8404da8070a48689e7e941\"/);

            getConnectionOptionsStub.restore();
        }
    });
});
