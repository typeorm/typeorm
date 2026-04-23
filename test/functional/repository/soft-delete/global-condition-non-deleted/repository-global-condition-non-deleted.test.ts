import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe(`repository > the global condtion of "non-deleted"`, () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it(`The global condition of "non-deleted" should be set for the entity with delete date columns`, () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.title = "title#1"
                const post2 = new Post()
                post2.title = "title#2"
                const post3 = new Post()
                post3.title = "title#3"

                await dataSource.manager.save(post1)
                await dataSource.manager.save(post2)
                await dataSource.manager.save(post3)

                await dataSource.manager.softRemove(post1)

                const loadedPosts = await dataSource.getRepository(Post).find()
                loadedPosts!.length.should.be.equal(2)
                const loadedPost2 = loadedPosts.find((p) => p.id === 2)
                expect(loadedPost2).to.exist
                expect(loadedPost2!.deletedAt).to.equals(null)
                expect(loadedPost2!.title).to.equals("title#2")
                const loadedPost3 = loadedPosts.find((p) => p.id === 3)
                expect(loadedPost3).to.exist
                expect(loadedPost3!.deletedAt).to.equals(null)
                expect(loadedPost3!.title).to.equals("title#3")
            }),
        ))

    it(`The global condition of "non-deleted" should not be set when the option "withDeleted" is set to true`, () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.title = "title#1"
                const post2 = new Post()
                post2.title = "title#2"
                const post3 = new Post()
                post3.title = "title#3"

                await dataSource.manager.save(post1)
                await dataSource.manager.save(post2)
                await dataSource.manager.save(post3)

                await dataSource.manager.softRemove(post1)

                const loadedPosts = await dataSource.getRepository(Post).find({
                    withDeleted: true,
                })

                loadedPosts!.length.should.be.equal(3)
                const loadedPost1 = loadedPosts.find((p) => p.id === 1)
                expect(loadedPost1).to.exist
                expect(loadedPost1!.deletedAt).to.be.instanceof(Date)
                expect(loadedPost1!.title).to.equals("title#1")
                const loadedPost2 = loadedPosts.find((p) => p.id === 2)
                expect(loadedPost2).to.exist
                expect(loadedPost2!.deletedAt).to.equals(null)
                expect(loadedPost2!.title).to.equals("title#2")
                const loadedPost3 = loadedPosts.find((p) => p.id === 3)
                expect(loadedPost3).to.exist
                expect(loadedPost3!.deletedAt).to.equals(null)
                expect(loadedPost3!.title).to.equals("title#3")

                const loadedPost = await dataSource
                    .getRepository(Post)
                    .findOne({
                        where: {
                            id: 1,
                        },
                        withDeleted: true,
                    })
                expect(loadedPost).to.exist
                expect(loadedPost!.title).to.equals("title#1")
            }),
        ))
})
