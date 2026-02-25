import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"
import { expect } from "chai"

describe("github issues > #10079 Unwanted quotation marks in json field", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [User],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should generate a query with properties names replaced only when not inside a literal string", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const foo = new User()
                foo.name = "Foo"
                foo.age = 35
                foo.updated = []

                await dataSource.manager.save([foo])

                const qb = dataSource
                    .createQueryBuilder()
                    .update(User)
                    .set({
                        name: "Bar",
                        age: () => "age + 1",
                        updated: () =>
                            `'{"obs":"Increased age by one, it''s working"}' || updated`,
                    })
                    .where("id = :id", { id: 1 })

                const query = qb.getQuery()
                const result = await qb.execute()

                expect(query.includes("Increased age by one")).to.be.true

                // should not quote tokens inside strings
                expect(query.includes('Increased "age" by one')).to.be.false

                // query should run with no errors
                expect(result.affected === 1).to.be.true
            }),
        )
    })
})
