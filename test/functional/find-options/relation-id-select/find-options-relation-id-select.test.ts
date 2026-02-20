import "reflect-metadata"
import "../../../utils/test-setup"
import { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"

describe("find options > select with @RelationId", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                __dirname,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function prepareData(dataSource: DataSource) {
        const category = new Category()
        category.name = "Science"
        await dataSource.manager.save(category)

        const post = new Post()
        post.title = "Hello World"
        post.category = category
        await dataSource.manager.save(post)
    }

    it("should be able to select @RelationId() fields using find()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const posts = await dataSource.manager.find(Post, {
                    select: { id: true, title: true, categoryId: true },
                })

                posts.length.should.be.eql(1)
                posts[0].id.should.be.eql(1)
                posts[0].title.should.be.eql("Hello World")
                posts[0].categoryId.should.be.eql(1)
            }),
        ))

    it("should be able to select @RelationId() fields using findAndCount()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const [posts, count] = await dataSource.manager.findAndCount(
                    Post,
                    {
                        select: {
                            id: true,
                            title: true,
                            categoryId: true,
                        },
                    },
                )

                count.should.be.eql(1)
                posts.length.should.be.eql(1)
                posts[0].id.should.be.eql(1)
                posts[0].title.should.be.eql("Hello World")
                posts[0].categoryId.should.be.eql(1)
            }),
        ))

    it("should be able to select @RelationId() field with id", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const posts = await dataSource.manager.find(Post, {
                    select: { id: true, categoryId: true },
                })

                posts.length.should.be.eql(1)
                posts[0].id.should.be.eql(1)
                posts[0].categoryId.should.be.eql(1)
            }),
        ))

    it("should be able to select @RelationId() fields using repository.findAndCount()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await prepareData(dataSource)

                const postRepository = dataSource.getRepository(Post)
                const [posts, count] = await postRepository.findAndCount({
                    select: {
                        id: true,
                        title: true,
                        categoryId: true,
                    },
                    take: 500,
                })

                count.should.be.eql(1)
                posts.length.should.be.eql(1)
                posts[0].id.should.be.eql(1)
                posts[0].title.should.be.eql("Hello World")
                posts[0].categoryId.should.be.eql(1)
            }),
        ))
})
