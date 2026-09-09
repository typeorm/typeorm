import { expect } from "chai"
import "reflect-metadata"
import sinon from "sinon"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Author } from "./entity/Author"
import { Book } from "./entity/Book"
import { Comment } from "./entity/Comment"
import { Category } from "./entity/Category"
import { Profile } from "./entity/Profile"
import { Review } from "./entity/Review"

describe("relations > load-strategy > query", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const setupTestData = async (dataSource: DataSource) => {
        const authorRepository = dataSource.getRepository(Author)
        const bookRepository = dataSource.getRepository(Book)
        const commentRepository = dataSource.getRepository(Comment)

        const author1 = await authorRepository.save(
            authorRepository.create({ name: "author1" }),
        )
        const author2 = await authorRepository.save(
            authorRepository.create({ name: "author2" }),
        )

        const books1 = await bookRepository.save(
            bookRepository.create([
                { title: "book1", text: "text1", author: [author1] },
                { title: "book2", text: "text2", author: [author1] },
                { title: "book3", text: "text3", author: [author1] },
            ]),
        )
        const books2 = await bookRepository.save(
            bookRepository.create([
                { title: "book4", text: "text4", author: [author2] },
                { title: "book5", text: "text5", author: [author2] },
            ]),
        )

        for (const book of [...books1, ...books2]) {
            for (let i = 0; i < 2; i++) {
                await commentRepository.save(
                    commentRepository.create({
                        text: `${book.title}: comment${i}`,
                        bookId: book.id,
                        authorId:
                            book === books1[0] ||
                            book === books1[1] ||
                            book === books1[2]
                                ? author1.id
                                : author2.id,
                    }),
                )
            }
        }
        return {
            authorRepository,
            bookRepository,
            authors: [author1, author2],
            books: [...books1, ...books2],
        }
    }

    describe("ManyToMany eager", () => {
        it("should load eager ManyToMany relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, authors } =
                        await setupTestData(dataSource)

                    const result = await authorRepository.findOne({
                        where: { id: authors[0].id },
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    expect(result?.name).to.equal("author1")
                    expect(result?.books).to.be.an("array")
                    expect(result?.books).to.have.length(3)

                    const titles = result?.books
                        .map((b) => b.title)
                        .sort((a, b) => a.localeCompare(b))
                    expect(titles).to.deep.equal(["book1", "book2", "book3"])
                }),
            ))
    })

    describe("OneToMany eager (nested)", () => {
        it("should load nested eager OneToMany relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, authors } =
                        await setupTestData(dataSource)

                    const result = await authorRepository.findOne({
                        where: { id: authors[0].id },
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    for (const book of result?.books ?? []) {
                        expect(book.comments).to.be.an("array")
                        expect(book.comments).to.have.length(2)
                        for (const comment of book.comments ?? []) {
                            expect(comment.text).to.include(book.title)
                        }
                    }
                }),
            ))
    })

    describe("ManyToOne eager", () => {
        it("should load eager ManyToOne relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { books } = await setupTestData(dataSource)
                    const reviewRepository = dataSource.getRepository(Review)

                    await reviewRepository.save(
                        reviewRepository.create([
                            { text: "great", book: books[0] },
                            { text: "ok", book: books[0] },
                        ]),
                    )

                    const reviews = await reviewRepository.find({
                        relationLoadStrategy: "query",
                    })

                    expect(reviews).to.have.length(2)
                    for (const review of reviews) {
                        expect(review.book).to.not.be.undefined
                        expect(review.book).to.not.be.null
                        expect(review.book.title).to.equal("book1")
                        expect(review.book.comments).to.be.an("array")
                    }
                }),
            ))
    })

    describe("OneToOne eager", () => {
        it("should load eager OneToOne relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authors } = await setupTestData(dataSource)
                    const profileRepository = dataSource.getRepository(Profile)

                    await profileRepository.save(
                        profileRepository.create([
                            { bio: "bio1", author: authors[0] },
                            { bio: "bio2", author: authors[1] },
                        ]),
                    )

                    const profiles = await profileRepository.find({
                        relationLoadStrategy: "query",
                    })

                    expect(profiles).to.have.length(2)
                    for (const profile of profiles) {
                        expect(profile.author).to.not.be.undefined
                        expect(profile.author).to.not.be.null
                        expect(profile.author.name).to.be.oneOf([
                            "author1",
                            "author2",
                        ])
                    }
                }),
            ))
    })

    describe("self-referencing", () => {
        it("should load self-referencing parent relation via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const manager = dataSource.manager

                    const parent1 = await manager.save(new Category())
                    const parent2 = await manager.save(new Category())

                    const child1 = new Category()
                    child1.parent = parent1
                    await manager.save(child1)

                    const child2 = new Category()
                    child2.parent = parent2
                    await manager.save(child2)

                    const loaded1 = await manager.findOne(Category, {
                        where: { id: child1.id },
                        relations: { parent: true },
                        relationLoadStrategy: "query",
                    })
                    const loaded2 = await manager.findOne(Category, {
                        where: { id: child2.id },
                        relations: { parent: true },
                        relationLoadStrategy: "query",
                    })

                    expect(loaded1).to.not.be.null
                    expect(loaded1?.parent?.id).to.equal(parent1.id)
                    expect(loaded2).to.not.be.null
                    expect(loaded2?.parent?.id).to.equal(parent2.id)
                }),
            ))

        it("should load three levels of self-referencing relations via query strategy", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const manager = dataSource.manager

                    const grandparent = await manager.save(new Category())

                    const parent = new Category()
                    parent.parent = grandparent
                    await manager.save(parent)

                    const child = new Category()
                    child.parent = parent
                    await manager.save(child)

                    const loaded = await manager.findOne(Category, {
                        where: { id: child.id },
                        relations: { parent: { parent: true } },
                        relationLoadStrategy: "query",
                    })

                    expect(loaded).to.not.be.null
                    expect(loaded?.parent?.id).to.equal(parent.id)
                    expect(loaded?.parent?.parent?.id).to.equal(grandparent.id)
                }),
            ))
    })

    describe("empty relations", () => {
        it("should return empty array for ManyToMany with no related entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const authorRepository = dataSource.getRepository(Author)

                    const author = await authorRepository.save(
                        authorRepository.create({ name: "lonely author" }),
                    )

                    const result = await authorRepository.findOne({
                        where: { id: author.id },
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    expect(result?.books).to.be.an("array")
                    expect(result?.books).to.have.length(0)
                }),
            ))

        it("should return empty array for OneToMany with no related entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const authorRepository = dataSource.getRepository(Author)
                    const bookRepository = dataSource.getRepository(Book)

                    const author = await authorRepository.save(
                        authorRepository.create({ name: "author" }),
                    )
                    const book = await bookRepository.save(
                        bookRepository.create({
                            title: "empty book",
                            text: "no comments",
                            author: [author],
                        }),
                    )

                    const result = await authorRepository.findOne({
                        where: { id: author.id },
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    const loadedBook = result?.books.find(
                        (b) => b.id === book.id,
                    )
                    expect(loadedBook).to.not.be.undefined
                    expect(loadedBook?.comments).to.be.an("array")
                    expect(loadedBook?.comments).to.have.length(0)
                }),
            ))
    })

    describe("find() with multiple results", () => {
        it("should load eager relations for all entities returned by find()", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository } = await setupTestData(dataSource)

                    const results = await authorRepository.find({
                        relationLoadStrategy: "query",
                        order: { name: "ASC" },
                    })

                    expect(results).to.have.length(2)

                    expect(results[0].name).to.equal("author1")
                    expect(results[0].books).to.be.an("array")
                    expect(results[0].books).to.have.length(3)

                    expect(results[1].name).to.equal("author2")
                    expect(results[1].books).to.be.an("array")
                    expect(results[1].books).to.have.length(2)

                    for (const author of results) {
                        for (const book of author.books) {
                            expect(book.comments).to.be.an("array")
                            expect(book.comments).to.have.length(2)
                        }
                    }
                }),
            ))
    })

    describe("DataSource-level strategy", () => {
        let dsLevelDataSources: DataSource[]
        before(async () => {
            dsLevelDataSources = await createTestingConnections({
                disabledDrivers: ["spanner"],
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                relationLoadStrategy: "query",
            })
        })
        beforeEach(() => reloadTestingDatabases(dsLevelDataSources))
        after(() => closeTestingConnections(dsLevelDataSources))

        it("should respect relationLoadStrategy set at DataSource level", () =>
            Promise.all(
                dsLevelDataSources.map(async (dataSource) => {
                    const authorRepository = dataSource.getRepository(Author)
                    const bookRepository = dataSource.getRepository(Book)

                    const author1 = await authorRepository.save(
                        authorRepository.create({ name: "ds-author1" }),
                    )
                    const author2 = await authorRepository.save(
                        authorRepository.create({ name: "ds-author2" }),
                    )

                    await bookRepository.save(
                        bookRepository.create([
                            {
                                title: "ds-book1",
                                text: "t1",
                                author: [author1],
                            },
                            {
                                title: "ds-book2",
                                text: "t2",
                                author: [author2],
                            },
                        ]),
                    )

                    const results = await authorRepository.find({
                        order: { name: "ASC" },
                    })

                    expect(results).to.have.length(2)
                    expect(results[0].books).to.be.an("array")
                    expect(results[0].books).to.have.length(1)
                    expect(results[0].books[0].title).to.equal("ds-book1")

                    expect(results[1].books).to.be.an("array")
                    expect(results[1].books).to.have.length(1)
                    expect(results[1].books[0].title).to.equal("ds-book2")
                }),
            ))

        it("should propagate DataSource-level strategy for self-referencing relations", () =>
            Promise.all(
                dsLevelDataSources.map(async (dataSource) => {
                    const manager = dataSource.manager

                    const grandparent = await manager.save(new Category())

                    const parent = new Category()
                    parent.parent = grandparent
                    await manager.save(parent)

                    const child = new Category()
                    child.parent = parent
                    await manager.save(child)

                    const loaded = await manager.findOne(Category, {
                        where: { id: child.id },
                        relations: { parent: { parent: true } },
                    })

                    expect(loaded).to.not.be.null
                    expect(loaded?.parent?.id).to.equal(parent.id)
                    expect(loaded?.parent?.parent?.id).to.equal(grandparent.id)
                }),
            ))
    })

    describe("loadEagerRelations", () => {
        it("should not load any eager relations when loadEagerRelations is false and no explicit relations", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, authors } =
                        await setupTestData(dataSource)

                    const result = await authorRepository.findOne({
                        where: { id: authors[0].id },
                        loadEagerRelations: false,
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    expect(result?.name).to.equal("author1")
                    expect(result?.books).to.be.undefined
                }),
            ))

        it("should load explicit relations but suppress nested eager when loadEagerRelations is false", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, authors } =
                        await setupTestData(dataSource)

                    const result = await authorRepository.findOne({
                        where: { id: authors[0].id },
                        relations: { books: true },
                        loadEagerRelations: false,
                        relationLoadStrategy: "query",
                    })

                    expect(result).to.not.be.null
                    expect(result?.books).to.be.an("array")
                    expect(result?.books).to.have.length(3)

                    for (const book of result?.books ?? []) {
                        expect(book.comments).to.be.undefined
                    }
                }),
            ))
    })

    // https://github.com/typeorm/typeorm/issues/12775
    describe("relation already joined by the main query", () => {
        afterEach(() => sinon.restore())

        const recordCommentQueries = (dataSource: DataSource) => {
            const queries: string[] = []
            sinon.stub(dataSource.logger, "logQuery").callsFake((query) => {
                if (query.toLowerCase().includes("comment")) queries.push(query)
            })
            return queries
        }

        it("should not load the relation again when the query left-joins and selects it", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { bookRepository } = await setupTestData(dataSource)

                    const commentQueries = recordCommentQueries(dataSource)
                    const books = await bookRepository
                        .createQueryBuilder("book")
                        .setFindOptions({ relationLoadStrategy: "query" })
                        .leftJoinAndSelect("book.comments", "book__comments")
                        .orderBy("book__comments.text", "ASC")
                        .getMany()

                    expect(commentQueries).to.have.length(1)
                    expect(books).to.have.length(5)
                    for (const book of books) {
                        expect(book.comments).to.have.length(2)
                        for (const comment of book.comments ?? []) {
                            expect(comment.text).to.be.a("string")
                        }
                    }
                }),
            ))

        it("should load the relation in full when the join carries an ON condition", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { bookRepository } = await setupTestData(dataSource)

                    const books = await bookRepository
                        .createQueryBuilder("book")
                        .setFindOptions({ relationLoadStrategy: "query" })
                        .leftJoinAndSelect(
                            "book.comments",
                            "book__comments",
                            "book__comments.text LIKE :text",
                            { text: "%comment0" },
                        )
                        .getMany()

                    expect(books).to.have.length(5)
                    for (const book of books) {
                        expect(book.comments).to.have.length(2)
                    }
                }),
            ))

        it("should load the relation in full when a where clause filters the joined alias", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { bookRepository } = await setupTestData(dataSource)

                    const books = await bookRepository
                        .createQueryBuilder("book")
                        .setFindOptions({ relationLoadStrategy: "query" })
                        .leftJoinAndSelect("book.comments", "book__comments")
                        .where("book__comments.text LIKE :text", {
                            text: "%comment0",
                        })
                        .getMany()

                    expect(books).to.have.length(5)
                    for (const book of books) {
                        expect(book.comments).to.have.length(2)
                    }
                }),
            ))

        it("should load the relation when the joined relation has eager relations of its own", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository } = await setupTestData(dataSource)

                    const commentQueries = recordCommentQueries(dataSource)
                    const authors = await authorRepository
                        .createQueryBuilder("author")
                        .setFindOptions({ relationLoadStrategy: "query" })
                        .leftJoinAndSelect("author.books", "author__books")
                        .getMany()

                    expect(commentQueries).to.not.be.empty
                    expect(authors).to.have.length(2)
                    for (const author of authors) {
                        for (const book of author.books) {
                            expect(book.comments).to.have.length(2)
                        }
                    }
                }),
            ))
    })
})
