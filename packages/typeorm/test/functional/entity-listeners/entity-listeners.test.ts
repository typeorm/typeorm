import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Parent } from "./entity/Parent"
import { ChildA } from "./entity/ChildA"
import { ChildB } from "./entity/ChildB"
import { Post } from "./entity/Post"

describe("entity-listeners", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            dropSchema: true,
            schemaCreate: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("beforeUpdate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.title = "post title"
                post.text = "post text"
                await dataSource.manager.save(post)

                let loadedPost = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: post.id })
                loadedPost!.title = "post title   "
                await dataSource.manager.save(loadedPost)

                loadedPost = await dataSource
                    .getRepository(Post)
                    .findOneBy({ id: post.id })
                loadedPost!.title.should.be.equal("post title")
            }),
        ))
    it("should call correct listeners when using inheritance", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(Parent)
                const childA = new ChildA()
                childA.count = 0
                await repo.save(childA)

                const loadedChildA = await dataSource
                    .getRepository(ChildA)
                    .findOneBy({ id: childA.id })
                loadedChildA!.count.should.be.equal(1)

                const childB = new ChildB()
                childB.name = "childB"
                await repo.save(childB)

                childB.name = "childBB"
                await repo.save(childB)

                const loadedChildB = await dataSource
                    .getRepository(ChildB)
                    .findOneBy({ id: childB.id })
                loadedChildB!.name.should.be.equal("childBB")
            }),
        ))
})
