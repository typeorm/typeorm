import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Product } from "./entity/Product"

describe("query builder > parameters > date parameters", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [Product],
                schemaCreate: true,
                dropSchema: true,
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be escaped correctly", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const productRepository = dataSource.getRepository(Product)
                await productRepository.save([
                    {
                        name: "Product A",
                        createdAt: new Date("2025-12-22T00:00:00Z"),
                    },
                    {
                        name: "Product B",
                        createdAt: new Date("2025-12-23T00:00:00Z"),
                    },
                    {
                        name: "Product C",
                        createdAt: new Date("2025-12-24T00:00:00Z"),
                    },
                ])

                const newProducts = await productRepository
                    .createQueryBuilder("product")
                    .select("product.name")
                    .where("product.createdAt >= :afterDate", {
                        afterDate: new Date("2025-12-22T12:00:00Z"),
                    })
                    .getMany()

                expect(newProducts).to.deep.equal([
                    { name: "Product B" },
                    { name: "Product C" },
                ])
            }),
        ))
})
