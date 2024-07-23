import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { Post as PostModified } from "./entity/PostModified"
import sinon from "sinon"
import { MigrationGenerateCommand } from "../../../src/commands/MigrationGenerateCommand"
import { CommandUtils } from "../../../src/commands/CommandUtils"

async function ensureDataSourceDestroyed(dataSource: DataSource) {
    if (dataSource && dataSource.isInitialized) {
        await dataSource.destroy()
    }
}

describe("Migration directory tests", () => {
    let connections: DataSource[]
    let createFileStub: sinon.SinonStub
    let loadDataSourceStub: sinon.SinonStub

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
            enabledDrivers: [
                "mysql",
                "postgres",
                "sqlite",
                "mariadb",
                "better-sqlite3",
                "sqljs",
                "oracle",
            ],
        })

        createFileStub = sinon.stub(CommandUtils, "createFile")
        loadDataSourceStub = sinon.stub(CommandUtils, "loadDataSource")
    })

    after(async () => {
        await closeTestingConnections(connections)
        createFileStub.restore()
        loadDataSourceStub.restore()
    })

    afterEach(async () => {
        createFileStub.resetHistory()
        for (const connection of connections) {
            await ensureDataSourceDestroyed(connection)
        }
    })

    it("should save migration in directory specified in DataSource", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                loadDataSourceStub.resolves(connection)

                await connection.setOptions({
                    ...connection.options,
                    entities: [Post],
                    migrations: ["./src/migrations/*{.js,.ts}"],
                })

                await ensureDataSourceDestroyed(connection)

                await connection.initialize()

                await connection.setOptions({
                    ...connection.options,
                    entities: [PostModified],
                })
                await ensureDataSourceDestroyed(connection)
                const migrationGenerateCommand = new MigrationGenerateCommand()
                await migrationGenerateCommand.handler({
                    dataSource: "dummy-path",
                    path: "test-migration",
                    timestamp: "1610975184784",
                    exitProcess: false,
                    _: [],
                    $0: "",
                })

                sinon.assert.calledWith(
                    createFileStub,
                    sinon.match(
                        /src\/migrations\/1610975184784-test-migration.ts/,
                    ),
                )
                await ensureDataSourceDestroyed(connection)
            }),
        )
    })

    it("should save migration in root if no migrations directory specified in DataSource", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                loadDataSourceStub.resolves(connection)

                await connection.setOptions({
                    ...connection.options,
                    entities: [Post],
                    migrations: undefined,
                })

                await connection.setOptions({
                    ...connection.options,
                    entities: [PostModified],
                })

                await ensureDataSourceDestroyed(connection)

                const migrationGenerateCommand = new MigrationGenerateCommand()

                await migrationGenerateCommand.handler({
                    dataSource: "dummy-path",
                    path: "test-migration",
                    timestamp: "1610975184784",
                    exitProcess: false,
                    _: [],
                    $0: "",
                })

                sinon.assert.calledWith(
                    createFileStub,
                    sinon.match(/1610975184784-test-migration.ts/),
                )
            }),
        )
    })
})
