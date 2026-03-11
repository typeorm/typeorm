import "reflect-metadata"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { expect } from "chai"
import type { DataSource } from "../../../../../src/data-source/DataSource"

describe("query builder > relational query builder > add operation > one to many relation", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should add entity relation of a given entity by entity objects", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.name = "category #1"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.name = "category #2"
                await dataSource.manager.save(category2)

                const category3 = new Category()
                category3.name = "category #3"
                await dataSource.manager.save(category3)

                const post1 = new Post()
                post1.title = "post #1"
                await dataSource.manager.save(post1)

                const post2 = new Post()
                post2.title = "post #2"
                await dataSource.manager.save(post2)

                const post3 = new Post()
                post3.title = "post #3"
                await dataSource.manager.save(post3)

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of(category1)
                    .add(post1)

                let loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.eql({
                    id: 1,
                    name: "category #1",
                })

                let loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.null

                let loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.null

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of(category1)
                    .remove(post1)

                loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.null

                loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.null

                loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.null
            }),
        ))

    it("should add entity relation of a given entity by entity id", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.name = "category #1"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.name = "category #2"
                await dataSource.manager.save(category2)

                const category3 = new Category()
                category3.name = "category #3"
                await dataSource.manager.save(category3)

                const post1 = new Post()
                post1.title = "post #1"
                await dataSource.manager.save(post1)

                const post2 = new Post()
                post2.title = "post #2"
                await dataSource.manager.save(post2)

                const post3 = new Post()
                post3.title = "post #3"
                await dataSource.manager.save(post3)

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of(2) // category id
                    .add(2) // post id

                let loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.null

                let loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.eql({
                    id: 2,
                    name: "category #2",
                })

                let loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.null

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of(2) // category id
                    .remove(2) // post id

                loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.null

                loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.null

                loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.null
            }),
        ))

    it("should add entity relation of a given entity by entity id map", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.name = "category #1"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.name = "category #2"
                await dataSource.manager.save(category2)

                const category3 = new Category()
                category3.name = "category #3"
                await dataSource.manager.save(category3)

                const post1 = new Post()
                post1.title = "post #1"
                await dataSource.manager.save(post1)

                const post2 = new Post()
                post2.title = "post #2"
                await dataSource.manager.save(post2)

                const post3 = new Post()
                post3.title = "post #3"
                await dataSource.manager.save(post3)

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of({ id: 3 }) // category id
                    .add({ id: 3 }) // post id

                let loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.null

                let loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.null

                let loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.eql({
                    id: 3,
                    name: "category #3",
                })

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of({ id: 3 }) // category id
                    .remove({ id: 3 }) // post id

                loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.null

                loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.null

                loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.null
            }),
        ))

    it("should add multiple entities into relation of a multiple entities", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.name = "category #1"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.name = "category #2"
                await dataSource.manager.save(category2)

                const category3 = new Category()
                category3.name = "category #3"
                await dataSource.manager.save(category3)

                const post1 = new Post()
                post1.title = "post #1"
                await dataSource.manager.save(post1)

                const post2 = new Post()
                post2.title = "post #2"
                await dataSource.manager.save(post2)

                const post3 = new Post()
                post3.title = "post #3"
                await dataSource.manager.save(post3)

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of({ id: 3 }) // category
                    .add([{ id: 1 }, { id: 3 }]) // posts

                let loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.eql({
                    id: 3,
                    name: "category #3",
                })

                let loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.null

                let loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.eql({
                    id: 3,
                    name: "category #3",
                })

                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of({ id: 3 }) // category
                    .remove([{ id: 1 }, { id: 3 }]) // posts

                loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 1 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.null

                loadedPost2 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost2!.category).to.be.null

                loadedPost3 = await dataSource.manager.findOne(Post, {
                    where: { id: 3 },
                    relations: { category: true },
                })
                expect(loadedPost3!.category).to.be.null
            }),
        ))

    it("should handle addAndRemove method as well", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.name = "category #1"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.name = "category #2"
                await dataSource.manager.save(category2)

                const category3 = new Category()
                category3.name = "category #3"
                await dataSource.manager.save(category3)

                const post1 = new Post()
                post1.title = "post #1"
                await dataSource.manager.save(post1)

                const post2 = new Post()
                post2.title = "post #2"
                await dataSource.manager.save(post2)

                const post3 = new Post()
                post3.title = "post #3"
                await dataSource.manager.save(post3)

                // add initial data
                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of(category3) // category
                    .add(post2) // post

                let loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.eql({
                    id: 3,
                    name: "category #3",
                })

                // when nothing is specified nothing should be performed
                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of(category3) // category
                    .addAndRemove([], []) // post

                loadedPost1 = await dataSource.manager.findOne(Post, {
                    where: { id: 2 },
                    relations: { category: true },
                })
                expect(loadedPost1!.category).to.be.eql({
                    id: 3,
                    name: "category #3",
                })

                // now add and remove =)
                await dataSource
                    .createQueryBuilder()
                    .relation(Category, "posts")
                    .of(category3) // category
                    .addAndRemove([post1, post3], [post2]) // post

                const loadedCategory = await dataSource.manager.findOne(
                    Category,
                    { where: { id: 3 }, relations: { posts: true } },
                )
                expect(loadedCategory!.posts).to.deep.include({
                    id: 1,
                    title: "post #1",
                })
                expect(loadedCategory!.posts).to.not.contain({
                    id: 2,
                    title: "post #2",
                })
                expect(loadedCategory!.posts).to.deep.include({
                    id: 3,
                    title: "post #3",
                })
            }),
        ))
})
