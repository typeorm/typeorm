import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Tag } from "./entity/Tag"

describe("relations > composite foreign key with joinTable order different from PK order", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Tag],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create junction table when inverseJoinColumns order differs from PK order", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const tag = new Tag()
                tag.firstId = 10
                tag.secondId = 20
                await dataSource.manager.save(tag)

                const post = new Post()
                post.tags = [tag]
                await dataSource.manager.save(post)

                const loaded = await dataSource.manager.findOneOrFail(Post, {
                    where: { id: post.id },
                    relations: { tags: true },
                })

                expect(loaded.tags).to.have.length(1)
                expect(loaded.tags[0].firstId).to.equal(10)
                expect(loaded.tags[0].secondId).to.equal(20)
            }),
        ))
})
