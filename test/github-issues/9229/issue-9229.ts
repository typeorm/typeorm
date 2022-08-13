import sinon from "sinon"
import {
    DataSourceOptions,
    ConnectionOptionsReader,
    DataSource,
    DatabaseType,
} from "../../../src"
import {
    setupTestingConnections,
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { CommandUtils } from "../../../src/commands/CommandUtils"
import { MigrationGenerateCommand } from "../../../src/commands/MigrationGenerateCommand"
import { TestEntity } from "./entity/test.entity"
import { User } from "./entity/user"
import path from "path"

describe("github issues > #9229 for some reason, TypeORM generates a second migration file after running all migrations", () => {
    let connections: DataSource[]
    let connectionOptions: DataSourceOptions[]
    let createFileStub: sinon.SinonStub
    let getConnectionOptionsStub: sinon.SinonStub
    let migrationGenerateCommand: MigrationGenerateCommand
    let connectionOptionsReader: ConnectionOptionsReader
    let baseConnectionOptions: DataSourceOptions

    const enabledDrivers = ["postgres"] as DatabaseType[]

    // simulate args: `npm run typeorm migration:run -- -n test-migration -d migration`
    const testHandlerArgs = (options: Record<string, any>) => ({
        $0: "test",
        _: ["test"],
        name: "test-migration",
        dir: "migration",
        path: "/migration",
        ...options,
    })

    before(async () => {
        connections = await createTestingConnections({
            __dirname,
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: enabledDrivers,
        })
        await reloadTestingDatabases(connections)
        connections.map(async (connection) => {
            await connection.runMigrations()
        }),
            await closeTestingConnections(connections)

        connectionOptions = setupTestingConnections({
            entities: [TestEntity, User],
            enabledDrivers: enabledDrivers,
        })
        connectionOptionsReader = new ConnectionOptionsReader()
        migrationGenerateCommand = new MigrationGenerateCommand()
        createFileStub = sinon.stub(CommandUtils, "createFile")
    })

    after(() => createFileStub.restore())

    it("should not create and run second migration", async () => {
        for (const connectionOption of connectionOptions) {
            createFileStub.resetHistory()
            baseConnectionOptions = await connectionOptionsReader.get(
                connectionOption.name as string,
            )
            connectionOption.migrationsRun
            getConnectionOptionsStub = sinon
                .stub(ConnectionOptionsReader.prototype, "get")
                .resolves({
                    ...baseConnectionOptions,
                    entities: [TestEntity, User],
                })

            await migrationGenerateCommand.handler(
                testHandlerArgs({
                    dataSource: path.resolve(__dirname, "data-source"),
                }),
            )

            getConnectionOptionsStub.restore()
        }
    })
})
