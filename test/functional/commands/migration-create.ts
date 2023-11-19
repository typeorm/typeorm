import "../../utils/test-setup"
import sinon from "sinon"
import {
    ConnectionOptionsReader,
    DatabaseType,
    DataSourceOptions,
} from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupTestingConnections,
} from "../../utils/test-utils"
import { CommandUtils } from "../../../src/commands/CommandUtils"
import { MigrationCreateCommand } from "../../../src/commands/MigrationCreateCommand"
import { Post } from "./entity/Post"
import { resultsTemplates } from "./templates/result-templates-create"

describe("commands - migration create", () => {
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let timerStub: sinon.SinonFakeTimers
    let getConnectionOptionsStub: sinon.SinonStub
    let migrationCreateCommand: MigrationCreateCommand
    let connectionOptionsReader: ConnectionOptionsReader
    let baseConnectionOptions: DataSourceOptions

    const enabledDrivers: DatabaseType[] = [
        "better-sqlite3",
        "cockroachdb",
        "mariadb",
        "mssql",
        "mysql",
        "oracle",
        "postgres",
        "sqlite",
    ]

    // simulate args: `npm run typeorm migration:run -- -n test-migration -d test-directory`
    const testHandlerArgs = (options: Record<string, any>) => ({
        $0: "test",
        _: ["test"],
        path: "test-directory/test-migration",
        ...options,
    })

    before(async () => {
        // clean out db from any prior tests in case previous state impacts the generated migrations
        const connections = await createTestingConnections({
            entities: [],
            enabledDrivers,
        })
        await reloadTestingDatabases(connections)
        await closeTestingConnections(connections)

        connectionOptions = setupTestingConnections({
            entities: [Post],
            enabledDrivers,
        })
        connectionOptionsReader = new ConnectionOptionsReader()
        migrationCreateCommand = new MigrationCreateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")

        timerStub = sinon.useFakeTimers(1610975184784)
    })

    after(async () => {
        timerStub.restore()
        createFileStub.restore()
    })

    afterEach(async () => {
        getConnectionOptionsStub?.restore()
    })

    it("should write regular empty migration file when no option is passed", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            baseConnectionOptions = await connectionOptionsReader.get(
                connectionOption.name as string,
            )
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves({
                    ...baseConnectionOptions,
                    entities: [Post],
                })

            await migrationCreateCommand.handler(
                testHandlerArgs({
                    connection: connectionOption.name,
                }),
            )

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.ts/),
                sinon.match(resultsTemplates.control),
            )

            getConnectionOptionsStub.restore()
        }
    })

    it("should write Javascript empty migration file when option is passed", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            baseConnectionOptions = await connectionOptionsReader.get(
                connectionOption.name as string,
            )
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves({
                    ...baseConnectionOptions,
                    entities: [Post],
                })

            await migrationCreateCommand.handler(
                testHandlerArgs({
                    connection: connectionOption.name,
                    outputJs: true,
                }),
            )

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.js/),
                sinon.match(resultsTemplates.javascript),
            )

            getConnectionOptionsStub.restore()
        }
    })

    it("should use custom timestamp when option is passed", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            baseConnectionOptions = await connectionOptionsReader.get(
                connectionOption.name as string,
            )
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves({
                    ...baseConnectionOptions,
                    entities: [Post],
                })

            await migrationCreateCommand.handler(
                testHandlerArgs({
                    connection: connectionOption.name,
                    timestamp: "1641163894670",
                }),
            )

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match("test-directory/1641163894670-test-migration.ts"),
                sinon.match(resultsTemplates.timestamp),
            )

            getConnectionOptionsStub.restore()
        }
    })
})
