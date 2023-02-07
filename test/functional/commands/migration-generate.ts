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
import { MigrationGenerateCommand } from "../../../src/commands/MigrationGenerateCommand"
import { Post } from "./entity/Post"
import { resultsTemplates } from "./templates/result-templates-generate"

// TODO: broken after 0.3.0 changes, fix later
describe.skip("commands - migration generate", () => {
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let timerStub: sinon.SinonFakeTimers
    let getConnectionOptionsStub: sinon.SinonStub
    let migrationGenerateCommand: MigrationGenerateCommand
    let connectionOptionsReader: ConnectionOptionsReader
    let baseConnectionOptions: DataSourceOptions

    const enabledDrivers = ["mysql"] as DatabaseType[]

    // simulate args: `npm run typeorm migration:run -- -n test-migration -d test-directory`
    const testHandlerArgs = (options: Record<string, any>) => ({
        $0: "test",
        _: ["test"],
        name: "test-migration",
        dir: "test-directory",
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
        migrationGenerateCommand = new MigrationGenerateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")

        timerStub = sinon.useFakeTimers(1610975184784)
    })

    after(async () => {
        timerStub.restore()
        createFileStub.restore()
    })

    it("writes regular migration file when no option is passed", async () => {
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

            await migrationGenerateCommand.handler(
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

    it("writes Javascript printed file when option is passed", async () => {
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

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    connection: connectionOption.name,
                    outputJs: true,
                }),
            )

            // compare against "pretty" test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.js/),
                sinon.match(resultsTemplates.javascript),
            )

            getConnectionOptionsStub.restore()
        }
    })

    it("writes migration file with custom timestamp when option is passed", async () => {
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

            await migrationGenerateCommand.handler(
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
