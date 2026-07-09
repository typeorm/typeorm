import sinon from "sinon"
import type { DatabaseType, DataSourceOptions } from "../../../src"
import { ConnectionOptionsReader, DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    setupTestingConnections,
} from "../../utils/test-utils"
import { CommandUtils } from "../../../src/commands/CommandUtils"
import { MigrationGenerateCommand } from "../../../src/commands/MigrationGenerateCommand"
import { Post } from "./entity/Post"
import { PostWithLongTitle } from "./entity/PostWithLongTitle"
import { resultsTemplates } from "./templates/result-templates-generate"

describe("commands - migration generate", () => {
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let loadDataSourceStub: sinon.SinonStub
    let getConnectionOptionsStub: sinon.SinonStub
    let migrationGenerateCommand: MigrationGenerateCommand
    let connectionOptionsReader: ConnectionOptionsReader
    let baseConnectionOptions: DataSourceOptions[]

    const enabledDrivers = [
        "postgres",
        "mssql",
        "mysql",
        "mariadb",
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

            baseConnectionOptions = await connectionOptionsReader.get()
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves([
                    {
                        ...baseConnectionOptions[0],
                        entities: [Post],
                    },
                ])

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

            baseConnectionOptions = await connectionOptionsReader.get()
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves([
                    {
                        ...baseConnectionOptions[0],
                        entities: [Post],
                    },
                ])

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

            baseConnectionOptions = await connectionOptionsReader.get()
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves([
                    {
                        ...baseConnectionOptions[0],
                        entities: [Post],
                    },
                ])

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

    /**
     * Regression test for https://github.com/typeorm/typeorm/issues/3357
     *
     * When only the `length` property of a column is changed (e.g. VARCHAR 255 → 500),
     * TypeORM must generate an ALTER COLUMN migration. Previously this produced an empty
     * migration because `isColumnChanged` did not check `length`.
     */
    it("generates ALTER COLUMN when only column length changes (issue #3357)", async () => {
        // Drivers that support length-based column types and have expected templates
        const lengthChangeDrivers = ["mysql", "mariadb", "mssql", "oracle"]

        const lengthChangeConnectionOptions = connectionOptions.filter((opt) =>
            lengthChangeDrivers.includes(opt.type as string),
        )

        for (const connectionOption of lengthChangeConnectionOptions) {
            // First, set up the DB with the original Post entity (title varchar 255)
            const setupConnections = await createTestingConnections({
                entities: [Post],
                enabledDrivers: [connectionOption.type as DatabaseType],
            })
            await reloadTestingDatabases(setupConnections)
            await closeTestingConnections(setupConnections)

            createFileStub.resetHistory()

            baseConnectionOptions = await connectionOptionsReader.get()
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves([
                    {
                        ...baseConnectionOptions[0],
                        entities: [PostWithLongTitle],
                    },
                ])

            // DataSource reflects current DB state (Post with 255) but entity is PostWithLongTitle (500)
            loadDataSourceStub.resolves(new DataSource(connectionOption))

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    dataSource: "dummy-path",
                    timestamp: "1610975184784",
                    exitProcess: false,
                }),
            )

            // The migration must contain an ALTER statement, not be empty
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.ts/),
                sinon.match(
                    resultsTemplates[connectionOption.type]?.lengthChange,
                ),
            )

            getConnectionOptionsStub.restore()
        }
    })
})
