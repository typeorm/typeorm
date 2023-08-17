import "../../utils/test-setup"
import sinon from "sinon"
import { DatabaseType, DataSourceOptions } from "../../../src"
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
    let migrationCreateCommand: MigrationCreateCommand

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

    // simulate args: `npm run typeorm migration:create -- ./test-directory/test-migration`
    const testHandlerArgs = {
        $0: "test",
        _: ["test"],
        path: "./test-directory/test-migration",
    }

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
        migrationCreateCommand = new MigrationCreateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")

        timerStub = sinon.useFakeTimers(1610975184784)
    })

    after(async () => {
        timerStub.restore()
        createFileStub.restore()
    })

    it("should write regular empty migration file when no option is passed", async () => {
        for (const _connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            await migrationCreateCommand.handle(testHandlerArgs)

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.ts/),
                sinon.match(resultsTemplates.control),
            )
        }
    })

    it("should write Javascript empty migration file when option is passed", async () => {
        for (const _connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            await migrationCreateCommand.handle({
                ...testHandlerArgs,
                outputJs: true,
            })

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match(/test-directory.*test-migration.js/),
                sinon.match(resultsTemplates.javascript),
            )
        }
    })

    it("should use custom timestamp when option is passed", async () => {
        for (const _connectionOption of connectionOptions) {
            createFileStub.resetHistory()

            await migrationCreateCommand.handle({
                ...testHandlerArgs,
                timestamp: "1641163894670",
            })

            // compare against control test strings in results-templates.ts
            sinon.assert.calledWith(
                createFileStub,
                sinon.match("test-directory/1641163894670-test-migration.ts"),
                sinon.match(resultsTemplates.timestamp),
            )
        }
    })
})
