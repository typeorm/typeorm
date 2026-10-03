import type { DataSource } from "../../../src"
import { QueryFailedError } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post.js"
import { expect } from "chai"

describe("github issues > #9984 TransactionRetryWithProtoRefreshError should be handled by TypeORM", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["cockroachdb"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should retry the transaction callback on 40001 error with 'inject_retry_errors_enabled=true'", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // the injected errors only stop after retries within the same
                // transaction, so every retry fails until the limit is reached
                const queryRunner = dataSource.createQueryRunner()
                let attempts = 0
                let error: unknown
                try {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = true",
                    )
                    await queryRunner.manager.transaction((manager) => {
                        attempts++
                        const post = new Post()
                        post.name = "post"
                        return manager.save(post)
                    })
                } catch (err) {
                    error = err
                } finally {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = false",
                    )
                    await queryRunner.release()
                }

                expect(attempts).to.equal(6)
                expect(error).to.be.instanceOf(QueryFailedError)
                expect(
                    (error as QueryFailedError<Error & { code?: string }>)
                        .driverError.code,
                ).to.equal("40001")
                expect(await dataSource.manager.count(Post)).to.equal(0)
            }),
        ))

    it("should retry transaction on 40001 error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.name = "post"
                await dataSource.manager.save(post)

                const query = (name: string) =>
                    dataSource.manager.transaction(async (manager) => {
                        const updatedPost = new Post()
                        updatedPost.id = post.id
                        updatedPost.name = name
                        await manager.save(updatedPost)
                    })

                await Promise.all([1, 2, 3].map((i) => query(`changed_${i}`)))

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    Post,
                    {
                        id: post.id,
                    },
                )
                expect(loadedPost.name).to.not.equal("post")
            }),
        ))
})
