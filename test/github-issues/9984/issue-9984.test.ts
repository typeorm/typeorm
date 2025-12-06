import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post.js"
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

    it("should retry transaction on 40001 error with 'inject_retry_errors_enabled=true'", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await dataSource.query("SET inject_retry_errors_enabled = true")
                await queryRunner.startTransaction()

                const post = new Post()
                post.name = `post`
                await queryRunner.manager.save(post)
                await queryRunner.commitTransaction()
                await queryRunner.release()
                await dataSource.query(
                    "SET inject_retry_errors_enabled = false",
                )
                const loadedPost = await dataSource.manager.findOneBy(Post, {
                    id: post.id,
                })
                expect(loadedPost).to.be.not.undefined
            }),
        ))

    it("should retry transaction on 40001 error", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const post = new Post()
                post.name = "post"
                await queryRunner.manager.save(post)
                await queryRunner.release()

                const query = async (name: string) => {
                    const queryRunner = dataSource.createQueryRunner()
                    await queryRunner.startTransaction()
                    const updatedPost = new Post()
                    updatedPost.id = post.id
                    updatedPost.name = name
                    await queryRunner.manager.save(updatedPost)
                    await queryRunner.commitTransaction()
                    await queryRunner.release()
                }

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
