import sinon from "sinon"
import {
    ConnectionOptionsReader,
    DatabaseType,
    DataSource,
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
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("commands - migration generate", () => {
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let loadDataSourceStub: sinon.SinonStub
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
        migrationGenerateCommand = new MigrationGenerateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")
        loadDataSourceStub = sinon.stub(CommandUtils, "loadDataSource")
    })

    after(async () => {
        createFileStub.restore()
        loadDataSourceStub.restore()
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

            loadDataSourceStub.resolves(new DataSource(connectionOption))

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    dataSource: "dummy-path",
                    timestamp: "1610975184784",
                    exitProcess: false,
                }),
            )

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.ts/),
                sinon.match(resultsTemplates[connectionOption.type]?.control),
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

            loadDataSourceStub.resolves(new DataSource(connectionOption))

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    dataSource: "dummy-path",
                    timestamp: "1610975184784",
                    outputJs: true,
                    exitProcess: false,
                }),
            )

            // compare against "pretty" test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.js/),
                sinon.match(
                    resultsTemplates[connectionOption.type]?.javascript,
                ),
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

            loadDataSourceStub.resolves(new DataSource(connectionOption))

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    dataSource: "dummy-path",
                    timestamp: "1641163894670",
                    exitProcess: false,
                }),
            )

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match("test-directory/1641163894670-test-migration.ts"),
                sinon.match(resultsTemplates[connectionOption.type]?.timestamp),
            )

            getConnectionOptionsStub.restore()
        }
    })
})
