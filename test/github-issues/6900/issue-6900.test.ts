import { expect } from "chai"
import { MongoClient } from "mongodb"
import { DataSource, DataSourceOptions } from "../../../src"
import { MongoDataSourceOptions } from "../../../src/driver/mongodb/MongoDataSourceOptions"
import { MongoDriver } from "../../../src/driver/mongodb/MongoDriver"
import {
    closeTestingConnections,
    reloadTestingDatabases,
    setupTestingConnections,
} from "../../utils/test-utils"
import { Warn } from "./entity/Warn"

describe('github issues > #6900 MongoDB ConnectionManager doesn\'t select given database, creates new database "test" instead', () => {
    const connections: DataSource[] = []
    afterEach(async () => {
        await closeTestingConnections(connections)
        connections.length = 0
    })

    it("should connect to the expected database", async () => {
        const options = setupTestingConnections({ enabledDrivers: ["mongodb"] })

        if (options.length === 0) {
            // Skip if we can't grab the mongodb
            return
        }

        const host: string =
            (options[0] as MongoDataSourceOptions).host || "localhost"

        const dataSource = new DataSource({
            ...options[0],
            url: `mongodb://${host}`,
            database: "foo",
        } as DataSourceOptions)
        await dataSource.initialize()
        connections.push(dataSource)

        await reloadTestingDatabases(connections)

        const mongoDriver = dataSource.driver as MongoDriver
        const client = mongoDriver.queryRunner!
            .databaseConnection as unknown as MongoClient

        expect(client.db().databaseName).to.be.equal("foo")
        expect(mongoDriver.database).to.be.equal("foo")
    })

    it("should write data to the correct database", async () => {
        const options = setupTestingConnections({ enabledDrivers: ["mongodb"] })

        if (options.length === 0) {
            // Skip if we can't grab the mongodb
            return
        }

        const host: string =
            (options[0] as MongoDataSourceOptions).host || "localhost"

        const dataSource = new DataSource({
            ...options[0],
            entities: [Warn],
            url: `mongodb://${host}`,
            database: "foo",
        } as DataSourceOptions)
        await dataSource.initialize()

        connections.push(dataSource)

        await reloadTestingDatabases(connections)

        const repo = dataSource.getRepository(Warn)

        await repo.insert({
            id: Math.floor(Math.random() * 1000000),
            guild: "Hello",
            user: "WORLD",
            moderator: "Good Moderator",
            reason: "For Mongo not writing correctly to the database!",
            createdAt: new Date(),
        })

        const mongoDriver = dataSource.driver as MongoDriver
        const client = mongoDriver.queryRunner!
            .databaseConnection as unknown as MongoClient

        expect(
            await client.db("foo").collection("warnings").countDocuments(),
        ).to.be.greaterThan(0)
    })
})
