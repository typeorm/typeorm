import { DataSourceOptions, DataSource, DatabaseType } from "../../../src"
import {
    setupTestingConnections,
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { TestEntity } from "./entity/test.entity"
import { User } from "./entity/user"
import path from "path"
import { expect } from "chai"

const migrationsDir = path.join(__dirname, "../migration")

describe("github issues > #9229 for some reason, TypeORM generates a second migration file after running all migrations", () => {
    let connections: DataSource[]
    let connectionOptions: DataSourceOptions[]

    const enabledDrivers = ["postgres"] as DatabaseType[]

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
            dropSchema: false,
            logging: false,
            migrations: [`${migrationsDir}/*{.ts,.js}`],
            enabledDrivers: enabledDrivers,
        })
    })

    it("should not create second migration queries", async () => {
        for (const connectionOption of connectionOptions) {
            const dataSource = new DataSource(connectionOption)
            dataSource.setOptions({
                synchronize: false,
                migrationsRun: false,
            })
            await dataSource.initialize()
            const schemaBuilder = dataSource.driver.createSchemaBuilder()
            const syncQueries = await schemaBuilder.log()
            console.log(syncQueries)
            expect(syncQueries.downQueries).to.be.eql([])
            expect(syncQueries.upQueries).to.be.eql([])
        }
    })
})
