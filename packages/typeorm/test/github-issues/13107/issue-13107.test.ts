import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Item } from "./entity/Item"

describe("github issues > #13107 Value transformer runs twice on values the database fills in during save()", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Item],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should transform a database default once on save", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Item)

                const saved = await repository.save({ name: "Item" })
                const loaded = await repository.findOneByOrFail({
                    id: saved.id,
                })

                expect(saved.score).to.equal(10)
                expect(loaded.score).to.equal(10)
            }),
        ))

    it("should still transform a database default once on a query builder insert without RETURNING", () =>
        Promise.all(
            dataSources
                .filter(
                    (dataSource) =>
                        !dataSource.driver.isReturningSqlSupported("insert"),
                )
                .map(async (dataSource) => {
                    const item: Partial<Item> = { name: "Item" }

                    await dataSource
                        .createQueryBuilder()
                        .insert()
                        .into(Item)
                        .values(item)
                        .execute()

                    expect(item.score).to.equal(10)
                }),
        ))
})
