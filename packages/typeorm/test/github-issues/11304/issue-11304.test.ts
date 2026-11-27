import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #11304 Transformer is not applied to a join column filled by a cascade insert", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should transform the join column of children inserted through cascade", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = await dataSource.getRepository(User).save({
                    name: "Max",
                    posts: [{ title: "First" }, { title: "Second" }],
                })

                expect(user.id).to.be.a("string")
                for (const post of user.posts) {
                    expect(post.id).to.be.a("string")
                    expect(post.userId).to.equal(user.id)
                }
            }),
        ))
})
