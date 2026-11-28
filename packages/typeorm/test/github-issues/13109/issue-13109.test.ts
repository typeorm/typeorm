import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Item } from "./entity/Item"
import { Token } from "./entity/Token"

describe("github issues > #13109 Value transformer runs twice on values returned after insert on SQL Server, Oracle and CockroachDB", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Item, Token],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const withReturning = () =>
        dataSources.filter((dataSource) =>
            dataSource.driver.isReturningSqlSupported("insert"),
        )

    it("should transform a database default once on save", () =>
        Promise.all(
            withReturning().map(async (dataSource) => {
                const repository = dataSource.getRepository(Item)

                const saved = await repository.save({ name: "Item" })
                const loaded = await repository.findOneByOrFail({
                    id: saved.id,
                })

                expect(saved.score).to.equal(10)
                expect(loaded.score).to.equal(10)
            }),
        ))

    it("should transform a generated primary key once on save", () =>
        Promise.all(
            withReturning().map(async (dataSource) => {
                const repository = dataSource.getRepository(Token)

                const saved = await repository.save({ name: "Token" })
                const loaded = await repository.findOneByOrFail({
                    name: "Token",
                })

                expect(saved.id).to.match(/^u:[^:]+$/)
                expect(saved.id).to.equal(loaded.id)
            }),
        ))

    it("should still transform a database default once on a query builder insert", () =>
        Promise.all(
            dataSources
                .filter((dataSource) => dataSource.driver.generatedMapHydrated)
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
