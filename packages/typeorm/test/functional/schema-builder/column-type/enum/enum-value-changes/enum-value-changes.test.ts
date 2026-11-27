import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("schema builder > column type > enum > enum value changes", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql", "postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should change schema when enum definition changes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                const fruitColumn = metadata.columns.find(
                    (column) => column.propertyName === "fruit",
                )
                if (!fruitColumn) throw new Error("fruit column not found")
                const originalEnum = fruitColumn.enum

                // simulate changing the enum at runtime: rename Banana,
                // add Cherry — use a fresh array instead of mutating the
                // shared FruitEnum object to avoid polluting other tests
                fruitColumn.enum = ["apple", "pineapple", "BANANA", "cherry"]

                try {
                    await connection.synchronize()

                    const queryRunner = connection.createQueryRunner()
                    try {
                        const table = await queryRunner.getTable("post")
                        const fruitCol = table?.findColumnByName("fruit")

                        expect(fruitCol?.enum).to.deep.equal([
                            "apple",
                            "pineapple",
                            "BANANA",
                            "cherry",
                        ])
                    } finally {
                        await queryRunner.release()
                    }
                } finally {
                    // restore original enum to avoid polluting other tests
                    fruitColumn.enum = originalEnum
                }
            }),
        ))
})
