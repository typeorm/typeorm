import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"
import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"

import { DriverUtils } from "../../../src/driver/DriverUtils"
import { Category, Product } from "./entity"

describe("github issues > #10431 When requesting nested relations on foreign key primary entities, relation becomes empty entity rather than null", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Category, Product],
            schemaCreate: true,
            dropSchema: true,
        })

        for (const connection of connections) {
            // By default, MySQL uses backticks instead of quotes for identifiers
            if (DriverUtils.isMySQLFamily(connection.driver)) {
                const randomVirtualColumnMetadata = connection
                    .getMetadata(Category)
                    .columns.find(
                        (columnMetadata) =>
                            columnMetadata.propertyName ===
                            "randomVirtualColumn",
                    )!

                randomVirtualColumnMetadata.query = (alias) =>
                    `SELECT COUNT(*) FROM \`category\` WHERE \`id\` = ${alias}.\`id\``
            }
        }
    })
    after(() => closeTestingConnections(connections))

    it("should return [] when requested nested relations are empty on ManyToMany relation with @VirtualColumn definitions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const productRepo = connection.getRepository(Product)
                const testProduct = new Product()
                testProduct.name = "foo"

                await productRepo.save(testProduct)

                const foundProduct = await productRepo.findOne({
                    where: {
                        id: testProduct.id,
                    },
                    relations: { categories: true },
                })

                expect(foundProduct?.name).eq("foo")
                expect(foundProduct?.categories).eql([])
            }),
        ))
})
