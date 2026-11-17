import { expect } from "chai"
import "reflect-metadata"
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
import { Translation } from "./entity/Translation"
import { Part } from "./binary-key/entity/Part"

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

    // https://github.com/typeorm/typeorm/issues/13062
    describe("several parents", () => {
        const sorted = (values: string[]) =>
            values.sort((a, b) => a.localeCompare(b))

        it("should give each side of a ManyToMany only its own entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, bookRepository, authors, books } =
                        await setupTestData(dataSource)
                    await dataSource
                        .createQueryBuilder()
                        .relation(Author, "books")
                        .of(authors[1])
                        .add(books[2])

                    const loadedAuthors = await authorRepository.find({
                        relationLoadStrategy: "query",
                        order: { name: "ASC" },
                    })
                    const loadedBooks = await bookRepository.find({
                        relations: { author: true },
                        relationLoadStrategy: "query",
                        order: { title: "ASC" },
                    })

                    expect(
                        loadedAuthors.map((author) => [
                            author.name,
                            sorted(author.books.map((book) => book.title)),
                        ]),
                    ).to.deep.equal([
                        ["author1", ["book1", "book2", "book3"]],
                        ["author2", ["book3", "book4", "book5"]],
                    ])
                    expect(
                        loadedBooks.map((book) => [
                            book.title,
                            sorted(book.author!.map((author) => author.name)),
                        ]),
                    ).to.deep.equal([
                        ["book1", ["author1"]],
                        ["book2", ["author1"]],
                        ["book3", ["author1", "author2"]],
                        ["book4", ["author2"]],
                        ["book5", ["author2"]],
                    ])
                }),
            ))

        it("should give each parent only its own OneToMany entities", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository } = await setupTestData(dataSource)
                    await authorRepository.save(
                        authorRepository.create({ name: "author3" }),
                    )

                    const loadedAuthors = await authorRepository.find({
                        relations: { comments: true },
                        relationLoadStrategy: "query",
                        order: { name: "ASC" },
                    })

                    expect(
                        loadedAuthors.map((author) => [
                            author.name,
                            sorted(
                                author.comments.map((comment) => comment.text),
                            ),
                        ]),
                    ).to.deep.equal([
                        [
                            "author1",
                            [
                                "book1: comment0",
                                "book1: comment1",
                                "book2: comment0",
                                "book2: comment1",
                                "book3: comment0",
                                "book3: comment1",
                            ],
                        ],
                        [
                            "author2",
                            [
                                "book4: comment0",
                                "book4: comment1",
                                "book5: comment0",
                                "book5: comment1",
                            ],
                        ],
                        ["author3", []],
                    ])
                }),
            ))

        it("should give each child its own ManyToOne entity, and null for a null foreign key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { books } = await setupTestData(dataSource)
                    const reviewRepository = dataSource.getRepository(Review)
                    await reviewRepository.save(
                        reviewRepository.create([
                            { text: "review1", book: books[0] },
                            { text: "review2", book: books[3] },
                            { text: "review3" },
                        ]),
                    )

                    const reviews = await reviewRepository.find({
                        relationLoadStrategy: "query",
                        order: { text: "ASC" },
                    })

                    expect(
                        reviews.map((review) => [
                            review.text,
                            review.book?.title ?? null,
                        ]),
                    ).to.deep.equal([
                        ["review1", "book1"],
                        ["review2", "book4"],
                        ["review3", null],
                    ])
                }),
            ))

        it("should give each side of a OneToOne only its own entity", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { authorRepository, authors } =
                        await setupTestData(dataSource)
                    await authorRepository.save(
                        authorRepository.create({ name: "author3" }),
                    )
                    const profileRepository = dataSource.getRepository(Profile)
                    await profileRepository.save(
                        profileRepository.create([
                            { bio: "bio1", author: authors[0] },
                            { bio: "bio2", author: authors[1] },
                        ]),
                    )

                    const profiles = await profileRepository.find({
                        relationLoadStrategy: "query",
                        order: { bio: "ASC" },
                    })
                    const loadedAuthors = await authorRepository.find({
                        relations: { profile: true },
                        relationLoadStrategy: "query",
                        order: { name: "ASC" },
                    })

                    expect(
                        profiles.map((profile) => [
                            profile.bio,
                            profile.author.name,
                        ]),
                    ).to.deep.equal([
                        ["bio1", "author1"],
                        ["bio2", "author2"],
                    ])
                    expect(
                        loadedAuthors.map((author) => [
                            author.name,
                            author.profile?.bio ?? null,
                        ]),
                    ).to.deep.equal([
                        ["author1", "bio1"],
                        ["author2", "bio2"],
                        ["author3", null],
                    ])
                }),
            ))

        it("should match every column of a composite key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const { bookRepository, books } =
                        await setupTestData(dataSource)
                    const translationRepository =
                        dataSource.getRepository(Translation)
                    await translationRepository.save(
                        translationRepository.create([
                            {
                                bookId: books[0].id,
                                language: "en",
                                title: "book1-en",
                            },
                            {
                                bookId: books[0].id,
                                language: "fr",
                                title: "book1-fr",
                            },
                            {
                                bookId: books[1].id,
                                language: "en",
                                title: "book2-en",
                            },
                        ]),
                    )

                    const loadedBooks = await bookRepository.find({
                        relations: { translations: true },
                        relationLoadStrategy: "query",
                        order: { title: "ASC" },
                    })
                    const translations = await translationRepository.find({
                        relations: { book: true },
                        relationLoadStrategy: "query",
                        order: { title: "ASC" },
                    })

                    expect(
                        loadedBooks.map((book) => [
                            book.title,
                            sorted(
                                book.translations!.map(
                                    (translation) => translation.title,
                                ),
                            ),
                        ]),
                    ).to.deep.equal([
                        ["book1", ["book1-en", "book1-fr"]],
                        ["book2", ["book2-en"]],
                        ["book3", []],
                        ["book4", []],
                        ["book5", []],
                    ])
                    expect(
                        translations.map((translation) => [
                            translation.title,
                            translation.book.title,
                        ]),
                    ).to.deep.equal([
                        ["book1-en", "book1"],
                        ["book1-fr", "book1"],
                        ["book2-en", "book2"],
                    ])
                }),
            ))

        describe("binary keys", () => {
            let binaryKeyDataSources: DataSource[]
            before(async () => {
                binaryKeyDataSources = await createTestingConnections({
                    enabledDrivers: ["better-sqlite3", "sqljs"],
                    entities: [__dirname + "/binary-key/entity/*{.js,.ts}"],
                    schemaCreate: true,
                    dropSchema: true,
                })
            })
            beforeEach(() => reloadTestingDatabases(binaryKeyDataSources))
            after(() => closeTestingConnections(binaryKeyDataSources))

            it("should give each parent only its own OneToMany entities", () =>
                Promise.all(
                    binaryKeyDataSources.map(async (dataSource) => {
                        const partRepository = dataSource.getRepository(Part)
                        const [a, b] = await partRepository.save([
                            { serial: Uint8Array.from([1, 2]), name: "a" },
                            { serial: Uint8Array.from([1, 3]), name: "b" },
                        ])
                        await partRepository.save([
                            {
                                serial: Uint8Array.from([2, 1]),
                                name: "a1",
                                assembly: a,
                            },
                            {
                                serial: Uint8Array.from([2, 2]),
                                name: "a2",
                                assembly: a,
                            },
                            {
                                serial: Uint8Array.from([3, 1]),
                                name: "b1",
                                assembly: b,
                            },
                        ])

                        const parts = await partRepository.find({
                            relations: { components: true },
                            relationLoadStrategy: "query",
                            order: { name: "ASC" },
                        })

                        expect(
                            parts.map((part) => [
                                part.name,
                                sorted(
                                    part.components.map(
                                        (component) => component.name,
                                    ),
                                ),
                            ]),
                        ).to.deep.equal([
                            ["a", ["a1", "a2"]],
                            ["a1", []],
                            ["a2", []],
                            ["b", ["b1"]],
                            ["b1", []],
                        ])
                    }),
                ))
        })
    })
})
