import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { TestMongo } from "./entity/TestMongo"
import { TestSQL } from "./entity/TestSQL"

// Test for MongoDB is split out due to the ObjectId database model that isn't supported in other providers
describe("github issues > #3913 Cannnot set embedded entity to null | MongoDB", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/TestMongo{.js,.ts}"],
                cache: {
                    alwaysEnabled: true,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should set the embedded entity to null in the database for mongodb", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (connection.options.type !== "mongodb") return // Only run this test for mongodb
                const test = new TestMongo()
                test.embedded = null

                await connection.manager.save(test)

                const loadedTest = await connection.manager.findOne(TestMongo, {
                    where: { _id: test._id },
                })
                expect(loadedTest).to.be.eql({
                    _id: test._id,
                    embedded: null,
                })
            }),
        ))
})

describe("github issues > #3913 Cannnot set embedded entity to null", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/TestSQL{.js,.ts}"],
                cache: {
                    alwaysEnabled: true,
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should set the embedded entity to null in the database for non mongodb", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (connection.options.type === "mongodb") return // Don't run this test for mongodb
                const test = new TestSQL()
                test.embedded = null

                await connection.manager.save(test)

                const loadedTest = await connection.manager.findOne(TestSQL, {
                    where: { id: test.id },
                })
                expect(loadedTest).to.be.eql({
                    id: 1,
                    embedded: null,
                })
            }),
        ))
})
