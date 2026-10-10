import type { DataSource, EntityManager } from "../../../../src"
import { JsonContains } from "../../../../src/find-options/operator/JsonContains"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Item } from "./entity/Item"

describe("find options > find operators > JsonContains", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            enabledDrivers: ["postgres", "cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(manager: EntityManager) {
        const item1 = new Item()
        item1.input = [
            { id: "connection_id", value: "1" },
            { id: "user_id", value: "42" },
        ]
        await manager.save(item1)

        const item2 = new Item()
        item2.input = [{ id: "other", value: "x" }]
        await manager.save(item2)
    }

    it("should match jsonb columns by partial array containment", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource.manager)

                const matched = await dataSource.manager.find(Item, {
                    where: {
                        input: JsonContains([
                            { id: "connection_id", value: "1" },
                        ]),
                    },
                    order: {
                        id: "asc",
                    },
                })

                matched.should.have.length(1)
                matched[0].input.should.have.deep.members([
                    { id: "connection_id", value: "1" },
                    { id: "user_id", value: "42" },
                ])
            }),
        ))

    it("should not match when no array element is contained", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource.manager)

                const matched = await dataSource.manager.find(Item, {
                    where: {
                        input: JsonContains([{ id: "missing" }]),
                    },
                })

                matched.should.have.length(0)
            }),
        ))

    it("should match jsonb columns storing primitive arrays", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const item1 = new Item()
                item1.input = []
                item1.numbers = [5, 6, 7, 8]
                await manager.save(item1)

                const item2 = new Item()
                item2.input = []
                item2.numbers = [1, 2]
                await manager.save(item2)

                const matchedSubset = await manager.find(Item, {
                    where: {
                        numbers: JsonContains([5, 6]),
                    },
                    order: {
                        id: "asc",
                    },
                })
                matchedSubset.should.have.length(1)
                matchedSubset[0].numbers!.should.be.eql([5, 6, 7, 8])

                const matchedNone = await manager.find(Item, {
                    where: {
                        numbers: JsonContains([9]),
                    },
                })
                matchedNone.should.have.length(0)
            }),
        ))
})
