import sinon from "sinon"
import {
    DataSourceOptions,
    ConnectionOptionsReader,
    DatabaseType,
} from "../../../src"
import {
    setupTestingConnections,
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Username } from "./entity/Username"
import { CommandUtils } from "../../../src/commands/CommandUtils"
import { MigrationGenerateCommand } from "../../../src/commands/MigrationGenerateCommand"
import { Post } from "./entity/Post"
import { resultsTemplates } from "./results-templates"

// TODO: broken after 0.3.0 changes, fix later
describe.skip("github issues > #4415 allow beautify generated migrations", () => {
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let getConnectionOptionsStub: sinon.SinonStub
    let migrationGenerateCommand: MigrationGenerateCommand
    let connectionOptionsReader: ConnectionOptionsReader
    let baseConnectionOptions: DataSourceOptions

    const enabledDrivers = [
        "postgres",
        "mssql",
        "mysql",
        "mariadb",
        "sqlite",
        "better-sqlite3",
        "oracle",
        "cockroachdb",
    ] as DatabaseType[]

    // simulate args: `npm run typeorm migration:run -- -n test-migration -d test-directory`
    const testHandlerArgs = (options: Record<string, any>) => ({
        $0: "test",
        _: ["test"],
        name: "test-migration",
        dir: "test-directory",
        ...options,
    })

    beforeAll(async () => {
        // clean out db from any prior tests in case previous state impacts the generated migrations
        const connections = await createTestingConnections({
            entities: [],
            enabledDrivers,
        })
        await reloadTestingDatabases(connections)
        await closeTestingConnections(connections)

        connectionOptions = setupTestingConnections({
            entities: [Username, Post],
            enabledDrivers,
        })
        connectionOptionsReader = new ConnectionOptionsReader()
        migrationGenerateCommand = new MigrationGenerateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")
    })
    afterAll(() => createFileStub.restore())

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
                    entities: [Username, Post],
                })

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    connection: connectionOption.name,
                }),
            )

            // compare against control test strings in results-templates.ts
            for (const control of resultsTemplates[
                connectionOption.type as string
            ].control) {
                sinon.assert.calledWith(
                    createFileStub,
                    sinon.match(/test-directory.*test-migration.ts/),
                    sinon.match(control),
                )
            }

            getConnectionOptionsStub.restore()
        }
    })

    it("writes pretty printed file when pretty option is passed", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()
            baseConnectionOptions = await connectionOptionsReader.get(
                connectionOption.name as string,
            )
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves({
                    ...baseConnectionOptions,
                    entities: [Username, Post],
                })

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    connection: connectionOption.name,
                    pretty: true,
                }),
            )

            // compare against "pretty" test strings in results-templates.ts
            for (const pretty of resultsTemplates[
                connectionOption.type as string
            ].pretty) {
                sinon.assert.calledWith(
                    createFileStub,
                    sinon.match(/test-directory.*test-migration.ts/),
                    sinon.match(pretty),
                )
            }
            getConnectionOptionsStub.restore()
        }
    })
})
