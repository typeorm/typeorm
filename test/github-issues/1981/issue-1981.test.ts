import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Product } from "./entity/Product"

describe("github issues > #1981 Boolean values not casted properly when used in .find() condition", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["sqlite", "better-sqlite3"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should be able to find by boolean find", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const product = new Product()
                product.liked = true
                await connection.manager.save(product)

                const loadedProduct = await connection.manager.findOneBy(
                    Product,
                    { liked: true },
                )
                loadedProduct!.liked.should.be.equal(true)
            }),
        ))
})
