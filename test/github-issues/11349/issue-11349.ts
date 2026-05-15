import { DataSource } from "../../../src/data-source/DataSource"
import { Entity, PrimaryGeneratedColumn } from "../../../src/index"
import { expect } from "chai"

describe("github issues > #11349 SAP DEFAULT VALUES insert", () => {
    @Entity()
    class Product {
        @PrimaryGeneratedColumn()
        id: number
    }

    it("should not use DEFAULT VALUES for SAP driver", async () => {
        const dataSource = new DataSource({
            type: "better-sqlite3",
            database: ":memory:",
            synchronize: true,
            logging: false,
            entities: [Product],
        })

        await dataSource.initialize()

        // 🔥 simulate SAP driver
        ;(dataSource.driver as any).options.type = "sap"

        const repository = dataSource.getRepository(Product)

        const product = new Product()

        const queryBuilder = repository
            .createQueryBuilder()
            .insert()
            .into(Product)
            .values(product as any)

        const query = queryBuilder.getQuery()

        expect(query).to.not.include("DEFAULT VALUES")

        await dataSource.destroy()
    })
})
