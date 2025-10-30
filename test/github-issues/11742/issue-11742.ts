import "reflect-metadata"
import {
    closeTestingdataSources,
    createTestingdataSources,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { User } from "./entity/user"
import { Item } from "./entity/item"
import { expect } from "chai"

describe("github issues > #11742 getRawAndEntities with leftJoin, orderBy expression and take fails", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingdataSources({
            entities: [User, Item],
            enabledDrivers: ["postgres", "aurora-postgres", "cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingdataSources(dataSources))

    it("should not throw when using leftJoin + orderBy with expression + take + getRawAndEntities", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create test data
                const user1 = await dataSource.getRepository(User).save({
                    name: "User1",
                    age: 25,
                })
                const user2 = await dataSource.getRepository(User).save({
                    name: "User2",
                    age: 30,
                })

                await dataSource.getRepository(Item).save([
                    { name: "Item1", ownerId: user1.id },
                    { name: "Item2", ownerId: user1.id },
                    { name: "Item3", ownerId: user2.id },
                ])

                // Create query builder with leftJoin, orderBy with expression, and take
                const queryBuilder = dataSource
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .leftJoin("user.items", "item")
                    .orderBy("user.id + user.age", "ASC")
                    .take(2)

                // This should not throw an error
                const result = await queryBuilder.getRawAndEntities()

                // Verify we get results
                expect(result).to.be.an("object")
                expect(result.entities).to.be.an("array")
                expect(result.raw).to.be.an("array")
                expect(result.entities.length).to.be.lessThanOrEqual(2)
            }),
        ))

    it("should work with different orderBy expressions", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Create test data
                const user1 = await dataSource.getRepository(User).save({
                    name: "User1",
                    age: 25,
                })

                await dataSource.getRepository(Item).save({
                    name: "Item1",
                    ownerId: user1.id,
                })

                // Test with different expression types
                const expressions = [
                    "user.id + user.age",
                    "user.age * 2",
                    "user.id - user.age",
                ]

                for (const expression of expressions) {
                    const queryBuilder = dataSource
                        .getRepository(User)
                        .createQueryBuilder("user")
                        .leftJoin("user.items", "item")
                        .orderBy(expression, "DESC")
                        .take(1)

                    // Should not throw error for any expression
                    const result = await queryBuilder.getRawAndEntities()
                    expect(result.entities).to.be.an("array")
                    expect(result.raw).to.be.an("array")
                }
            }),
        ))
})
