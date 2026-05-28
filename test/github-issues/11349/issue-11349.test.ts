import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Product, ProductWithOptional } from "./entity/Product"

describe("github issues > #11349 SAP HANA: cannot save entity only with defaults", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Product, ProductWithOptional],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert an entity that has only a generated primary key", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const product = new Product()
                await dataSource.manager.save(product)

                expect(product.id).to.be.a("number")

                const loaded = await dataSource.manager.findOneByOrFail(
                    Product,
                    { id: product.id },
                )
                expect(loaded.id).to.equal(product.id)
            }),
        ))

    it("should insert an entity that only has defaults / nullable columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const product = new ProductWithOptional()
                await dataSource.manager.save(product)

                expect(product.id).to.be.a("number")

                const loaded = await dataSource.manager.findOneByOrFail(
                    ProductWithOptional,
                    { id: product.id },
                )
                expect(loaded.id).to.equal(product.id)
                expect(loaded.name).to.be.null
            }),
        ))
})
