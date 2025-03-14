import "reflect-metadata"
import { expect } from "chai"

import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

import { User } from "../10964/entity/User"

describe("github issues > Add support of 'hash' indexes for postgres", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should support 'hash' index", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.getMetadata(User).indices.find(idx => idx.type === 'hash')).not.null
            }),
    ))

    it("User should have two indices", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.getMetadata(User).indices.length).equal(2)
            }),
    ))
})
