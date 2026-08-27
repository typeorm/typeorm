import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Product } from "./entity/Product"
import { License } from "./entity/License"

describe("columns > bigint join column precision", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres", "mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve bigint precision when FK set via relation object", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const product = new Product()
                const savedProduct = await dataSource.manager.save(product)
                const productId = savedProduct.id

                const license = new License()
                license.id = "1"
                license.product = savedProduct
                await dataSource.manager.save(license)

                const [row] = await dataSource.query(
                    `SELECT product_id FROM licenses_bigint_jc WHERE id = 1`,
                )
                expect(String(row.product_id)).to.equal(String(productId))
            }),
        ))

    it("should preserve bigint precision when FK set directly as string", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const product = new Product()
                const savedProduct = await dataSource.manager.save(product)
                const productId = savedProduct.id

                const license = new License()
                license.id = "2"
                license.productId = String(productId)
                await dataSource.manager.save(license)

                const [row] = await dataSource.query(
                    `SELECT product_id FROM licenses_bigint_jc WHERE id = 2`,
                )
                expect(String(row.product_id)).to.equal(String(productId))
            }),
        ))
})
