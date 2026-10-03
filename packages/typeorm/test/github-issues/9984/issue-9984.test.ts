import type { DataSource } from "../../../src"
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
                // the injected errors stop after a few retries within the
                // same transaction, using the cockroach_restart savepoint
                const queryRunner = dataSource.createQueryRunner()
                let post: Post
                let attempts = 0
                try {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = true",
                    )
                    post = await queryRunner.manager.transaction((manager) => {
                        attempts++
                        // create the entity inside the callback so a failed
                        // attempt does not leave state on it for the next one
                        const post = new Post()
                        post.name = "post"
                        return manager.save(post)
                    })
                } finally {
                    await queryRunner.query(
                        "SET inject_retry_errors_enabled = false",
                    )
                    await queryRunner.release()
                }

                expect(attempts).to.be.greaterThan(1)
                const loadedPost = await dataSource.manager.findOneBy(Post, {
                    id: post.id,
                })
                expect(loadedPost).to.be.not.null
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
