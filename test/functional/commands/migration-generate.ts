import sinon from "sinon"
import { DatabaseType, DataSource, DataSourceOptions } from "../../../src"
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
import path from "path"

describe("commands - migration generate", () => {
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let timerStub: sinon.SinonFakeTimers
    let loadDataSourceStub: sinon.SinonStub | undefined
    let migrationGenerateCommand: MigrationGenerateCommand

    const enabledDrivers = ["mysql"] as DatabaseType[]

    // simulate args: `npm run typeorm migration:generate -- ./test-directory/test-migration -d ./dummy-data-source.ts`
    const testHandlerArgs = {
        $0: "test",
        _: ["test"],
        path: "./test-directory/test-migration",
        dataSource: "./dummy-data-source.ts",
    }
    const dummyDataSourceAbsPath = path.resolve(
        process.cwd(),
        testHandlerArgs.dataSource,
    )

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
        migrationGenerateCommand = new MigrationGenerateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")

        timerStub = sinon.useFakeTimers(1610975184784)
    })

    after(async () => {
        timerStub.restore()
        createFileStub.restore()
    })

    afterEach(async () => {
        loadDataSourceStub?.restore()
    })

    it("writes regular migration file when no option is passed", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            loadDataSourceStub = sinon
                .stub(CommandUtils, "loadDataSource")
                .resolves(new DataSource(connectionOption))

            await migrationGenerateCommand.handle(testHandlerArgs)

            sinon.assert.calledWith(loadDataSourceStub, dummyDataSourceAbsPath)
            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.ts/),
                sinon.match(resultsTemplates.control),
            )

            loadDataSourceStub.restore()
        }
    })

    it("writes Javascript printed file when option is passed", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            loadDataSourceStub = sinon
                .stub(CommandUtils, "loadDataSource")
                .resolves(new DataSource(connectionOption))

            await migrationGenerateCommand.handle({
                ...testHandlerArgs,
                outputJs: true,
            })

            // compare against "pretty" test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.js/),
                sinon.match(resultsTemplates.javascript),
            )

            loadDataSourceStub.restore()
        }
    })

    it("writes migration file with custom timestamp when option is passed", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            loadDataSourceStub = sinon
                .stub(CommandUtils, "loadDataSource")
                .resolves(new DataSource(connectionOption))

            await migrationGenerateCommand.handle({
                ...testHandlerArgs,
                timestamp: "1641163894670",
            })

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match("test-directory/1641163894670-test-migration.ts"),
                sinon.match(resultsTemplates.timestamp),
            )

            loadDataSourceStub.restore()
        }
    })
})
