import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("github issues > #12978", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres", "mysql", "mariadb", "cockroachdb"],
            // single connection so the next transaction reuses the released one,
            // which is exactly the reported corruption path
            driverSpecific: { poolSize: 1 },
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("release() with an active transaction must roll it back instead of letting a later transaction commit its rows", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.startTransaction()
                await queryRunner.manager.save(Post, { title: "abandoned" })
                await queryRunner.release()

                await dataSource.transaction(async (manager) => {
                    await manager.save(Post, { title: "next-request" })
                })

                const titles = (await dataSource.manager.find(Post))
                    .map((post) => post.title)
                    .sort()
                expect(titles).to.be.eql(["next-request"])
            }),
        )
    })
})
