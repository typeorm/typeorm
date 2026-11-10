import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import { Article } from "./entity/Article"
import { Author } from "./entity/Author"
import { Category } from "./entity/Category"
import { Content } from "./entity/Content"
import { Enrollment } from "./entity/Enrollment"
import { Note } from "./entity/Note"
import { Photo } from "./entity/Photo"
import { Post } from "./entity/Post"
import { Video } from "./entity/Video"

describe("query builder > entity hydration", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                Article,
                Author,
                Category,
                Content,
                Enrollment,
                Note,
                Photo,
                Post,
                Video,
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function seedPosts(dataSource: DataSource) {
        const authors = [
            { id: 1, name: "Author 1" },
            { id: 2, name: "Author 2" },
        ]
        await dataSource.getRepository(Author).save(authors)

        const categories = [
            { id: 1, name: "Category 1" },
            { id: 2, name: "Category 2" },
            { id: 3, name: "Category 3" },
        ]
        await dataSource.getRepository(Category).save(categories)

        await dataSource.getRepository(Photo).save([{ id: 1, url: "one.png" }])

        // post 1: two categories, an author, a different editor and a photo
        // post 2: one category, no author, no editor, no photo
        // post 3: no categories at all
        await dataSource.getRepository(Post).save([
            {
                id: 1,
                title: "Post 1",
                meta: { slug: "post-1", counters: { likes: 10, stars: 5 } },
                author: authors[0],
                editor: authors[1],
                photo: { id: 1 },
                categories: [categories[0], categories[1]],
            },
            {
                id: 2,
                title: "Post 2",
                meta: { slug: "post-2", counters: { likes: 20, stars: null } },
                categories: [categories[2]],
            },
            {
                id: 3,
                title: "Post 3",
                meta: { slug: "post-3", counters: { likes: 30, stars: 15 } },
                categories: [],
            },
        ])
    }

    describe("joins", () => {
        it("should keep joined collections separate per entity", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const posts = await dataSource
                        .createQueryBuilder(Post, "post")
                        .leftJoinAndSelect("post.categories", "category")
                        .orderBy("post.id", "ASC")
                        .addOrderBy("category.id", "ASC")
                        .getMany()

                    expect(posts).to.have.lengthOf(3)
                    expect(
                        posts.map((post) =>
                            post.categories.map((category) => category.id),
                        ),
                    ).to.eql([[1, 2], [3], []])
                }),
            ))

        it("should hydrate two aliases of the same entity independently", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const post = await dataSource
                        .createQueryBuilder(Post, "post")
                        .leftJoinAndSelect("post.author", "author")
                        .leftJoinAndSelect("post.editor", "editor")
                        .where("post.id = :id", { id: 1 })
                        .getOne()

                    expect(post!.author).to.be.instanceOf(Author)
                    expect(post!.author.id).to.equal(1)
                    expect(post!.editor).to.be.instanceOf(Author)
                    expect(post!.editor.id).to.equal(2)
                }),
            ))

        it("should return null for a to-one relation that did not match", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const post = await dataSource
                        .createQueryBuilder(Post, "post")
                        .leftJoinAndSelect("post.author", "author")
                        .leftJoinAndSelect("post.photo", "photo")
                        .where("post.id = :id", { id: 2 })
                        .getOne()

                    expect(post!.author).to.be.null
                    expect(post!.photo).to.be.null
                }),
            ))

        it("should map joined results onto the properties given by mapToProperty", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const post = await dataSource
                        .createQueryBuilder(Post, "post")
                        .leftJoinAndMapMany(
                            "post.mappedCategories",
                            "post.categories",
                            "category",
                        )
                        .leftJoinAndMapOne(
                            "post.mappedAuthor",
                            "post.author",
                            "author",
                        )
                        .where("post.id = :id", { id: 1 })
                        .orderBy("category.id", "ASC")
                        .getOne()

                    expect(
                        post!.mappedCategories.map((category) => category.id),
                    ).to.eql([1, 2])
                    expect(post!.mappedAuthor).to.be.instanceOf(Author)
                    expect(post!.mappedAuthor.id).to.equal(1)
                }),
            ))
    })

    describe("embedded columns", () => {
        it("should hydrate nested embeddeds, including null leaf values", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const posts = await dataSource
                        .createQueryBuilder(Post, "post")
                        .orderBy("post.id", "ASC")
                        .getMany()

                    expect(posts[0].meta.slug).to.equal("post-1")
                    expect(posts[0].meta.counters.likes).to.equal(10)
                    expect(posts[0].meta.counters.stars).to.equal(5)
                    expect(posts[1].meta.counters.likes).to.equal(20)
                    expect(posts[1].meta.counters.stars).to.be.null
                }),
            ))

        it("should only hydrate the columns that were selected", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const posts = await dataSource
                        .createQueryBuilder(Post, "post")
                        .select(["post.id", "post.meta.counters.likes"])
                        .orderBy("post.id", "ASC")
                        .getMany()

                    expect(posts).to.have.lengthOf(3)
                    expect(posts[0].title).to.be.undefined
                    expect(posts[0].meta.slug).to.be.undefined
                    expect(posts[0].meta.counters.likes).to.equal(10)
                }),
            ))
    })

    describe("composite primary keys", () => {
        it("should group rows by every primary key column", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource.getRepository(Enrollment).save([
                        { studentId: 1, courseId: 1, grade: "A" },
                        { studentId: 1, courseId: 2, grade: "B" },
                        { studentId: 2, courseId: 1, grade: "C" },
                    ])
                    await dataSource.getRepository(Note).save([
                        {
                            id: 1,
                            text: "first",
                            enrollment: { studentId: 1, courseId: 1 },
                        },
                        {
                            id: 2,
                            text: "second",
                            enrollment: { studentId: 1, courseId: 1 },
                        },
                        {
                            id: 3,
                            text: "third",
                            enrollment: { studentId: 1, courseId: 2 },
                        },
                    ])

                    const enrollments = await dataSource
                        .createQueryBuilder(Enrollment, "enrollment")
                        .leftJoinAndSelect("enrollment.notes", "note")
                        .orderBy("enrollment.studentId", "ASC")
                        .addOrderBy("enrollment.courseId", "ASC")
                        .addOrderBy("note.id", "ASC")
                        .getMany()

                    expect(enrollments).to.have.lengthOf(3)
                    expect(
                        enrollments.map((enrollment) => [
                            enrollment.studentId,
                            enrollment.courseId,
                            enrollment.notes.map((note) => note.id),
                        ]),
                    ).to.eql([
                        [1, 1, [1, 2]],
                        [1, 2, [3]],
                        [2, 1, []],
                    ])
                }),
            ))
    })

    describe("single table inheritance", () => {
        it("should hydrate each row into the entity its discriminator selects", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await dataSource
                        .getRepository(Article)
                        .save([{ id: 1, title: "Article 1", body: "body 1" }])
                    await dataSource
                        .getRepository(Video)
                        .save([{ id: 2, title: "Video 2", duration: 120 }])
                    await dataSource
                        .getRepository(Article)
                        .save([{ id: 3, title: "Article 3", body: "body 3" }])

                    const contents = await dataSource
                        .createQueryBuilder(Content, "content")
                        .orderBy("content.id", "ASC")
                        .getMany()

                    expect(contents).to.have.lengthOf(3)
                    expect(contents[0]).to.be.instanceOf(Article)
                    expect((contents[0] as Article).body).to.equal("body 1")
                    expect(contents[1]).to.be.instanceOf(Video)
                    expect((contents[1] as Video).duration).to.equal(120)
                    expect(contents[2]).to.be.instanceOf(Article)
                    expect((contents[2] as Article).body).to.equal("body 3")
                }),
            ))
    })

    describe("relation ids", () => {
        it("should map many-to-many relation ids, including empty ones", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const posts = await dataSource
                        .createQueryBuilder(Post, "post")
                        .loadRelationIdAndMap(
                            "post.categoryIds",
                            "post.categories",
                        )
                        .orderBy("post.id", "ASC")
                        .getMany()

                    expect(posts).to.have.lengthOf(3)
                    expect(
                        posts.map((post) => [...post.categoryIds].sort()),
                    ).to.eql([[1, 2], [3], []])
                }),
            ))

        it("should map many-to-one relation ids", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const posts = await dataSource
                        .createQueryBuilder(Post, "post")
                        .loadRelationIdAndMap("post.authorId", "post.author")
                        .orderBy("post.id", "ASC")
                        .getMany()

                    // posts without an author get null, not undefined: the loader
                    // selects the join column for every post, null included
                    expect(posts.map((post) => post.authorId)).to.eql([
                        1,
                        null,
                        null,
                    ])
                }),
            ))

        it("should map relation ids into a nested property path", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedPosts(dataSource)

                    const posts = await dataSource
                        .createQueryBuilder(Post, "post")
                        .loadRelationIdAndMap(
                            "post.nested.categoryIds",
                            "post.categories",
                        )
                        .orderBy("post.id", "ASC")
                        .getMany()

                    expect(
                        posts.map((post) =>
                            [...post.nested.categoryIds].sort(),
                        ),
                    ).to.eql([[1, 2], [3], []])
                }),
            ))
    })

    describe("many entities", () => {
        it("should hydrate every entity of a large result set independently", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const categories = Array.from(
                        { length: 150 },
                        (_, index) => ({
                            id: index + 1,
                            name: `Category ${index + 1}`,
                        }),
                    )
                    await dataSource
                        .getRepository(Category)
                        .save(categories, { chunk: 100 })

                    const posts = Array.from({ length: 50 }, (_, index) => ({
                        id: index + 1,
                        title: `Post ${index + 1}`,
                        meta: {
                            slug: `post-${index + 1}`,
                            counters: { likes: index, stars: index * 2 },
                        },
                        categories: categories.slice(index * 3, index * 3 + 3),
                    }))
                    await dataSource
                        .getRepository(Post)
                        .save(posts, { chunk: 25 })

                    const loaded = await dataSource
                        .createQueryBuilder(Post, "post")
                        .leftJoinAndSelect("post.categories", "category")
                        .orderBy("post.id", "ASC")
                        .addOrderBy("category.id", "ASC")
                        .getMany()

                    expect(loaded).to.have.lengthOf(50)
                    loaded.forEach((post, index) => {
                        expect(post.title).to.equal(`Post ${index + 1}`)
                        expect(post.meta.counters.likes).to.equal(index)
                        expect(
                            post.categories.map((category) => category.id),
                        ).to.eql([index * 3 + 1, index * 3 + 2, index * 3 + 3])
                    })
                }),
            ))
    })
})
