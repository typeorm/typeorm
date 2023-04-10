import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"

describe("github issues > #9931 EntityPropertyNotFound when using getters and setters in an Entity with column alias", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should find entity while using a key with a custom name", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = new User()
                user.name = "User 1"
                const res = await user.save()

                const users = await User.find({
                    select: { orderColumn: true },
                    order: { orderColumn: "ASC" },
                    where: { orderColumn: res.orderColumn },
                })

                expect(users[0].orderColumn).to.equal(res.orderColumn)
            }),
        ))
})
