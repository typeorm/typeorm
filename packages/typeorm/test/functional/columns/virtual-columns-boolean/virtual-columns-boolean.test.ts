import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("column > virtual columns > boolean", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mysql", "mariadb", "aurora-mysql"],
            schemaCreate: true,
            dropSchema: true,
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // https://github.com/typeorm/typeorm/issues/10599
    it("should hydrate boolean virtual columns as booleans", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                await repository.save([
                    { attachment: "file.txt" },
                    { attachment: null },
                ])

                const posts = await repository.find({ order: { id: "ASC" } })

                expect(posts).to.have.lengthOf(2)
                expect(posts[0].hasAttachment).to.be.true
                expect(posts[1].hasAttachment).to.be.false
                for (const post of posts) {
                    expect(post.alwaysTrue).to.be.true
                    expect(post.alwaysFalse).to.be.false
                }
            }),
        ))

    it("should hydrate boolean virtual columns as booleans with the query builder", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Post)
                await repository.save({ attachment: null })

                const post = await repository
                    .createQueryBuilder("post")
                    .getOneOrFail()

                expect(post.hasAttachment).to.be.false
                expect(post.alwaysTrue).to.be.true
                expect(post.alwaysFalse).to.be.false
            }),
        ))
})
