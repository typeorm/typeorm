import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Session as baseEntity } from "./entity/session"
import { Session as changedEntity } from "./entity/sessionchanged"

describe("github issues > #6714 Migration:generate issue with onUpdate using mariadb 10.4", () => {
    it("dont change anything", async () => {
        const connections: DataSource[] = await createTestingConnections({
            entities: [baseEntity],
            schemaCreate: false,
            dropSchema: true,
            enabledDrivers: ["mariadb"],
        })
        await reloadTestingDatabases(connections)
        await Promise.all(
            connections.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                expect(syncQueries.downQueries).to.be.eql([])
                expect(syncQueries.upQueries).to.be.eql([])
            }),
        )
        await closeTestingConnections(connections)
    })
    it("recognizing on update changes", async () => {
        // this connection create database with a Session entity
        const baseConnections = await createTestingConnections({
            entities: [baseEntity],
            schemaCreate: true, // create the database
            dropSchema: true,
            enabledDrivers: ["mariadb"],
        })
        // this connection change Session entity on update value
        const connections = await createTestingConnections({
            entities: [changedEntity],
            schemaCreate: false, // don't change the entity
            dropSchema: false,
            enabledDrivers: ["mariadb"],
            name: "test",
        })
        await Promise.all(
            connections.map(async (connection) => {
                const schemaBuilder = connection.driver.createSchemaBuilder()
                const syncQueries = await schemaBuilder.log()
                expect(syncQueries.downQueries.length).not.to.be.eql(0)
                expect(syncQueries.upQueries.length).not.to.be.eql(0)
            }),
        )
        await closeTestingConnections(baseConnections)
        await closeTestingConnections(connections)
    })
})
