import "reflect-metadata"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("database schema > mssql-parameters", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly insert/update/delete entities on SqlServer driver", () =>
        Promise.all(
            connections.map(async (connection) => {
                const postRepository = connection.getRepository(Post)

                const post1 = new Post()
                post1.id = 1
                post1.name = "Post #1"
                post1.category = "posts"
                post1.text = "This is post"
                await postRepository.save(post1)

                let loadedPost1 = (await postRepository.findOneBy({ id: 1 }))!

                loadedPost1.id.should.be.equal(post1.id)
                loadedPost1.name.should.be.equal(post1.name)
                loadedPost1.category.should.be.equal(post1.category)
                loadedPost1.text.should.be.equal(post1.text)

                loadedPost1.name = "Updated Post #1"
                loadedPost1.text = "This is updated post"
                await postRepository.save(loadedPost1)

                loadedPost1 = (await postRepository.findOneBy({ id: 1 }))!
                loadedPost1.name.should.be.equal("Updated Post #1")
                loadedPost1.text.should.be.equal("This is updated post")

                await postRepository.remove(loadedPost1)
                loadedPost1 = (await postRepository.findOneBy({ id: 1 }))!
                expect(loadedPost1).to.not.exist

                const post2 = new Post()
                post2.id = 2
                post2.name = "Post #2"
                post2.category = "posts"
                post2.text = "This is second post"

                await connection
                    .createQueryBuilder()
                    .insert()
                    .into(Post)
                    .values(post2)
                    .execute()

                let loadedPost2 = (await postRepository.findOneBy({ id: 2 }))!
                loadedPost2.id.should.be.equal(post2.id)
                loadedPost2.name.should.be.equal(post2.name)
                loadedPost2.category.should.be.equal(post2.category)
                loadedPost2.text.should.be.equal(post2.text)

                await connection
                    .createQueryBuilder()
                    .update(Post)
                    .set({ name: "Updated Post #2" })
                    .where("id = :id", { id: 2 })
                    .execute()

                loadedPost2 = (await postRepository.findOneBy({ id: 2 }))!
                loadedPost2.name.should.be.equal("Updated Post #2")

                await connection
                    .createQueryBuilder()
                    .delete()
                    .from(Post)
                    .where("id = :id", { id: "2" })
                    .execute()

                loadedPost2 = (await postRepository.findOneBy({ id: 2 }))!
                expect(loadedPost2).to.not.exist
            }),
        ))
})
