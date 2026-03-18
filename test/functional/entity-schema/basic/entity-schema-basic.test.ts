import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src"
import { PostEntity } from "./entity/PostEntity"
import { CategoryEntity } from "./entity/CategoryEntity"

describe("entity schemas > basic functionality", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [PostEntity, CategoryEntity],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should perform basic operations with entity using repository", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(PostEntity)
                const post = postRepository.create({
                    id: 1,
                    title: "First Post",
                    text: "About first post",
                })
                await postRepository.save(post)

                const loadedPost = await postRepository.findOneBy({
                    title: "First Post",
                })
                loadedPost!.id.should.be.equal(post.id)
                loadedPost!.title.should.be.equal("First Post")
                loadedPost!.text.should.be.equal("About first post")

                await postRepository.remove(loadedPost!)

                const loadedPostAfterRemove = await postRepository.findOneBy({
                    title: "First Post",
                })
                expect(loadedPostAfterRemove).to.be.null
            }),
        ))

    it("should perform basic operations with entity using manager", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = dataSource.manager.create(PostEntity, {
                    id: 1,
                    title: "First Post",
                    text: "About first post",
                })
                await dataSource.manager.save(PostEntity, post)

                const loadedPost = await dataSource.manager.findOneBy(
                    PostEntity,
                    { title: "First Post" },
                )
                loadedPost!.id.should.be.equal(post.id)
                loadedPost!.title.should.be.equal("First Post")
                loadedPost!.text.should.be.equal("About first post")

                await dataSource.manager.remove(PostEntity, loadedPost!)

                const loadedPostAfterRemove =
                    await dataSource.manager.findOneBy(PostEntity, {
                        title: "First Post",
                    })
                expect(loadedPostAfterRemove).to.be.null
            }),
        ))
})
