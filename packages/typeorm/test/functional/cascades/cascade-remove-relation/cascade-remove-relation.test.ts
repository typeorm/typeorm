import { expect } from "chai"
import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Details } from "./entity/Details"

describe("cascades > cascade remove relation", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Details],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should NOT remove the related entity when relation is set to null and cascade remove is not set", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const detailsRepository = dataSource.getRepository(Details)

                const details = new Details()
                details.comment = "this is a comment"

                const post = new Post()
                post.title = "Hello"
                post.details = details
                await postRepository.save(post) // cascade insert

                // unlink relation and save
                post.details = null
                await postRepository.save(post)

                // reload post — relation should be unlinked
                const reloadedPost = await postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.details", "details")
                    .where("post.id = :id", { id: post.id })
                    .getOne()

                expect(reloadedPost).to.not.be.null
                expect(reloadedPost?.details).to.be.null

                // details entity should still exist in the database
                const existingDetails = await detailsRepository.findOneBy({
                    id: details.id,
                })
                expect(existingDetails).to.not.be.null
                expect(existingDetails?.comment).to.equal("this is a comment")
            }),
        ))
})
