import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/index"
import { Author } from "./entity/Author"
import { Post } from "./entity/Post"
import { Comment } from "./entity/Comment"
import { SelectQueryBuilder } from "../../../src"
import { expect } from "chai"

describe("github issues > #9006 Eager relations do not respect relationLoadStrategy", () => {
    let dataSources: DataSource[]
    let originalGetMany: () => Promise<any[]>
    let originalGetOne: () => Promise<any[]>
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
            relationLoadStrategy: "query",
            logging: true,
        })

        originalGetMany = SelectQueryBuilder.prototype.getMany
        originalGetOne = SelectQueryBuilder.prototype.getOne
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("it should load eager relations using relationLoadStrategy as main strategy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const authorRepository = dataSource.getRepository(Author)
                const postRepository = dataSource.getRepository(Post)
                const commentRepository = dataSource.getRepository(Comment)

                const author = authorRepository.create({ name: "author" })
                await authorRepository.save(author)

                const post = postRepository.create({
                    title: "post",
                    text: "text",
                    authorId: author.id,
                })
                await postRepository.save(post)

                const comment = commentRepository.create({
                    text: "comment",
                    author,
                    postId: post.id,
                })
                await commentRepository.save(comment)

                let getManyCalled = 0
                SelectQueryBuilder.prototype.getMany = async function () {
                    expect((this as any).joins).to.be.an("array")
                    expect((this as any).joins).to.have.length(0)
                    getManyCalled++
                    return originalGetMany.call(this)
                }

                let getOneCalled = 0
                SelectQueryBuilder.prototype.getOne = async function () {
                    expect((this as any).joins).to.be.an("array")
                    expect((this as any).joins).to.have.length(0)
                    getOneCalled++
                    return originalGetOne.call(this)
                }

                const eageredAuthor = await authorRepository.findOne({
                    where: { id: author.id },
                })

                expect(getManyCalled).to.be.equal(3)
                expect(getOneCalled).to.be.equal(1)

                expect(eageredAuthor).to.deep.equal({
                    id: 1,
                    name: "author",
                    posts: [
                        {
                            id: 1,
                            title: "post",
                            text: "text",
                            authorId: 1,
                            comments: [
                                {
                                    id: 1,
                                    text: "comment",
                                    authorId: 1,
                                    postId: 1,
                                },
                            ],
                            likeAuthors: [],
                        },
                    ],
                })
            }),
        ))
})
