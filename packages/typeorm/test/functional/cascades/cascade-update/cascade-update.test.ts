import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { PostWithInsertOnly } from "./entity/PostWithInsertOnly"
import { Photo } from "./entity/Photo"

describe("cascades > cascade update", () => {
    describe("should cascade update when cascade: ['update'] is set", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post, Photo],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should update the related entity when parent is saved", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const photoRepository = dataSource.getRepository(Photo)
                    const postRepository = dataSource.getRepository(Post)

                    const photo = new Photo()
                    photo.url = "logo.png"
                    await photoRepository.save(photo)

                    const post = new Post()
                    post.title = "Hello"
                    post.photo = photo
                    await postRepository.save(post)

                    // reload with relation
                    const loadedPost = await postRepository
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.photo", "photo")
                        .where("post.id = :id", { id: post.id })
                        .getOneOrFail()

                    loadedPost.photo.url = "new-logo.png"
                    await postRepository.save(loadedPost)

                    // reload and verify update was cascaded
                    const reloadedPost = await postRepository
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.photo", "photo")
                        .where("post.id = :id", { id: post.id })
                        .getOneOrFail()
                    expect(reloadedPost.photo.url).to.equal("new-logo.png")
                }),
            ))
    })

    describe("should NOT cascade update when cascade: ['insert'] is set (update not included)", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Post, PostWithInsertOnly, Photo],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        it("should NOT update the related entity when parent is saved", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const postRepository =
                        dataSource.getRepository(PostWithInsertOnly)

                    const photo = new Photo()
                    photo.url = "logo.png"

                    const post = new PostWithInsertOnly()
                    post.title = "Hello"
                    post.photo = photo
                    await postRepository.save(post) // cascade insert

                    // modify relation and save parent
                    post.photo.url = "updated-logo.png"
                    await postRepository.save(post)

                    // reload and verify update was NOT cascaded
                    const reloadedPost = await postRepository
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.photo", "photo")
                        .where("post.id = :id", { id: post.id })
                        .getOneOrFail()

                    expect(reloadedPost.photo.url).to.equal("logo.png")
                }),
            ))
    })
})
