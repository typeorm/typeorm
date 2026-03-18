import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("columns > update-control", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should not update columns marked with update: false", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                if (dataSource.driver.options.type === "spanner") return

                const postRepository = dataSource.getRepository(Post)

                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorFirstName = "Umed"
                post.authorLastName = "Good"
                await postRepository.save(post)

                let loadedPost = await postRepository.findOneBy({
                    id: post.id,
                })
                expect(loadedPost!.authorFirstName).to.be.equal("Umed")
                expect(loadedPost!.authorLastName).to.be.equal("Default")

                post.title = "About columns1"
                post.text = "Some text about columns1"
                post.authorFirstName = "Umed1"
                post.authorLastName = "Good1"
                await postRepository.save(post)

                loadedPost = await postRepository.findOneBy({ id: post.id })
                expect(loadedPost!.title).to.be.equal("About columns1")
                expect(loadedPost!.text).to.be.equal("Some text about columns1")
                expect(loadedPost!.authorFirstName).to.be.equal("Umed")
                expect(loadedPost!.authorLastName).to.be.equal("Default")
            }),
        ))
})
