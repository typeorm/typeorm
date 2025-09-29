import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { FooBar } from "./entity/FooBar"
import { expect } from "chai"

describe("github issues > #8540 EntityManager#getId not working with composite primary key and lazy relations", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should recognize that entity has composite primary key", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(
                    connection
                        .getMetadata(FooBar)
                        .primaryColumns.map((x) => x.propertyName),
                ).to.be.deep.equal(["fooId", "barId"])
            }),
        ))

    it("should be able to get id of entity with composite primary key", () =>
        Promise.all(
            connections.map(async (connection) => {
                const fooBar = new FooBar()
                fooBar.fooId = "asdf"
                fooBar.barId = "zxcv"

                const id = connection.manager.getId(FooBar, fooBar)
                expect(id).to.be.deep.equal({
                    fooId: "asdf",
                    barId: "zxcv",
                })
            }),
        ))
})
