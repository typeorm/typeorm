import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { Note } from "./entity/Note"

describe("decorators > relation-id-decorator > many-to-one", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load ids when RelationId decorator used", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.id = 1
                category1.name = "cars"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.id = 2
                category2.name = "airplanes"
                await dataSource.manager.save(category2)

                const categoryByName1 = new Category()
                categoryByName1.id = 3
                categoryByName1.name = "BMW"
                await dataSource.manager.save(categoryByName1)

                const categoryByName2 = new Category()
                categoryByName2.id = 4
                categoryByName2.name = "Boeing"
                await dataSource.manager.save(categoryByName2)

                const post1 = new Post()
                post1.id = 1
                post1.title = "about BWM"
                post1.category = category1
                post1.categoryByName = categoryByName1
                await dataSource.manager.save(post1)

                const post2 = new Post()
                post2.id = 2
                post2.title = "about Boeing"
                post2.category = category2
                post2.categoryByName = categoryByName2
                await dataSource.manager.save(post2)

                const loadedPosts = await dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("post.id")
                    .getMany()

                expect(loadedPosts![0].categoryId).to.not.be.undefined
                expect(loadedPosts![0].categoryId).to.be.equal(1)
                expect(loadedPosts![0].categoryName).to.not.be.undefined
                expect(loadedPosts![0].categoryName).to.be.equal("BMW")
                expect(loadedPosts![1].categoryId).to.not.be.undefined
                expect(loadedPosts![1].categoryId).to.be.equal(2)
                expect(loadedPosts![1].categoryName).to.not.be.undefined
                expect(loadedPosts![1].categoryName).to.be.equal("Boeing")

                const loadedPost = await dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .where("post.id = :id", { id: 1 })
                    .getOneOrFail()

                expect(loadedPost.categoryId).to.not.be.undefined
                expect(loadedPost.categoryId).to.be.equal(1)
                expect(loadedPost.categoryName).to.not.be.undefined
                expect(loadedPost.categoryName).to.be.equal("BMW")
            }),
        ))

    const savePosts = async (dataSource: DataSource) => {
        const cars = new Category()
        cars.id = 1
        cars.name = "cars"
        const airplanes = new Category()
        airplanes.id = 2
        airplanes.name = "airplanes"
        await dataSource.manager.save([cars, airplanes])

        const post1 = new Post()
        post1.id = 1
        post1.title = "about BMW"
        post1.category = cars
        post1.categoryByName = airplanes
        const post2 = new Post()
        post2.id = 2
        post2.title = "about Boeing"
        post2.category = airplanes
        post2.categoryByName = cars
        const post3 = new Post()
        post3.id = 3
        post3.title = "about nothing"
        await dataSource.manager.save([post1, post2, post3])
    }

    it("should load ids with the query relation load strategy", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await savePosts(dataSource)

                const loadedPosts = await dataSource.manager.find(Post, {
                    order: { id: "ASC" },
                    relationLoadStrategy: "query",
                    relations: { category: true, categoryByName: true },
                })

                expect(
                    loadedPosts.map((post) => [
                        post.categoryId,
                        post.categoryName,
                    ]),
                ).to.deep.equal([
                    [1, "airplanes"],
                    [2, "cars"],
                    [null, null],
                ])
            }),
        ))

    it("should let the decorator id win over an explicitly mapped one", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await savePosts(dataSource)

                const loadedPost = await dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .loadRelationIdAndMap("post.categoryId", "post.category", {
                        disableMixedMap: true,
                    })
                    .where("post.id = :id", { id: 1 })
                    .getOneOrFail()

                expect(loadedPost.categoryId).to.be.equal(1)
            }),
        ))

    it("should set ids in the order they were added to the query", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await savePosts(dataSource)

                const loadedPost = await dataSource.manager
                    .createQueryBuilder(Post, "post")
                    .loadRelationIdAndMap(
                        "post.loadedCategory",
                        "post.category",
                        { disableMixedMap: true },
                    )
                    .where("post.id = :id", { id: 1 })
                    .getOneOrFail()

                expect(loadedPost).to.have.deep.property("loadedCategory", {
                    id: 1,
                })
                expect(loadedPost.categoryId).to.be.equal(1)
                const keys = Object.keys(loadedPost)
                expect(keys.indexOf("loadedCategory")).to.be.lessThan(
                    keys.indexOf("categoryId"),
                )
            }),
        ))

    it("should keep the default when the referenced column transformer returns undefined", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const note = new Note()
                note.id = 1
                note.tag = null
                await dataSource.manager.save(note)

                const loadedNote = await dataSource.manager.findOneByOrFail(
                    Note,
                    { id: 1 },
                )

                expect(loadedNote.tagId).to.be.equal(0)
            }),
        ))
})
