import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Category, Product } from "./entity/Item"

describe("table inheritance > overriding the default of an inherited column", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            disabledDrivers: ["spanner"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not apply the overridden default to sibling entities (#11475)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.save(new Product())
                await dataSource.manager.save(new Category())

                const [product] = await dataSource.manager.find(Product)
                const [category] = await dataSource.manager.find(Category)

                expect(product.name).to.equal("new product")
                expect(category.name).to.equal("unnamed")
            }),
        ))
})
