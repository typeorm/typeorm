import sinon from "sinon"
import {
    ConnectionOptionsReader,
    DatabaseType,
    DataSourceOptions,
    EntityMetadata,
    QueryRunner,
    RdbmsSchemaBuilderHook,
} from "../../../src"
import { SqlInMemory } from "../../../src/driver/SqlInMemory"
import { RdbmsSchemaBuilder } from "../../../src/schema-builder/RdbmsSchemaBuilder"
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
import { Query } from "../../../src/driver/Query"

class TestHook implements RdbmsSchemaBuilderHook {
    wm = new WeakMap<RdbmsSchemaBuilder, string[]>()
    async init(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadata: EntityMetadata[],
    ): Promise<void> {
        this.wm.set(
            schemaBuilder,
            entityMetadata.map((x) => x.tableName),
        )
    }
    async beforeAll(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadata: EntityMetadata[],
    ): Promise<SqlInMemory> {
        const sqlInMemory = new SqlInMemory()
        sqlInMemory.upQueries.push(new Query(`SELECT 1`))
        sqlInMemory.downQueries.push(new Query(`SELECT -1`))

        return sqlInMemory
    }
    async afterAll(
        queryRunner: QueryRunner,
        schemaBuilder: RdbmsSchemaBuilder,
        entityMetadata: EntityMetadata[],
    ): Promise<SqlInMemory> {
        const sqlInMemory = new SqlInMemory()
        sqlInMemory.upQueries.push(new Query(`SELECT 2`))
        sqlInMemory.downQueries.push(new Query(`SELECT -2`))

        return sqlInMemory
    }
}

describe("commands - migration generate > custom hooks", () => {
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let timerStub: sinon.SinonFakeTimers
    let getConnectionOptionsStub: sinon.SinonStub
    let migrationGenerateCommand: MigrationGenerateCommand
    let connectionOptionsReader: ConnectionOptionsReader
    let baseConnectionOptions: DataSourceOptions

    const enabledDrivers = ["postgres"] as DatabaseType[]

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
            schemaBuilderHooks: [new TestHook()],
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

            console.log(baseConnectionOptions)

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    connection: connectionOption.name,
                    path: "foo",
                    dataSource: "bar",
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
})
