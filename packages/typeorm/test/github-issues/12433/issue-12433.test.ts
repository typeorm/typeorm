import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src"
import { expect } from "chai"
import { Item } from "./entity/Item"

describe("github issues > #12433 prevent unchanged nullable foreign key from triggering update", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner", "mongodb"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))

    after(() => closeTestingConnections(dataSources))

    it("should not modify updatedAt when saving an unchanged entity with nullable relation already null", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const item = new Item()
                item.name = "Test item"
                item.discountGroup = null

                await connection.manager.save(item)

                const updatedAtBefore = item.updatedAt
                const createdAtBefore = item.createdAt

                await new Promise((resolve) => setTimeout(resolve, 100))

                await connection.manager.save(item)

                const savedItem = await connection.manager.findOneOrFail(Item, {
                    where: { id: item.id },
                })

                expect(savedItem.updatedAt.getTime()).to.be.equal(
                    updatedAtBefore.getTime(),
                )
                expect(savedItem.updatedAt.getTime()).to.be.equal(
                    createdAtBefore.getTime(),
                )
            }),
        ))
})
