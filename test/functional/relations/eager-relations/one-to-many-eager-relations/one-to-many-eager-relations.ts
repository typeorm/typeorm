import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { Author } from "./entity/Author"
import { Article } from "./entity/Article"
import { ArticleMeta } from "./entity/ArticleMeta"
import { Comment } from "./entity/Comment"
import { expect } from "chai"

describe("relations > eager relations > one-to-many", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    // =========================================================================
    // Helper: create an Author with articles (each with meta) and comments
    // =========================================================================

    async function createAuthorWithData(
        connection: DataSource,
        name: string,
        articleData: { title: string; views: number }[],
        commentTexts: string[],
    ): Promise<Author> {
        const author = new Author()
        author.name = name
        await connection.getRepository(Author).save(author)

        for (const data of articleData) {
            const meta = new ArticleMeta()
            meta.views = data.views
            await connection.getRepository(ArticleMeta).save(meta)

            const article = new Article()
            article.title = data.title
            article.author = author
            article.meta = meta
            await connection.getRepository(Article).save(article)
        }

        for (const text of commentTexts) {
            const comment = new Comment()
            comment.text = text
            comment.author = author
            await connection.getRepository(Comment).save(comment)
        }

        return author
    }

    // =========================================================================
    // (1) Basic: OneToMany eager loads automatically
    // =========================================================================

    it("should eagerly load OneToMany relations when using find", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(
                    connection,
                    "Alice",
                    [
                        { title: "Article One", views: 100 },
                        { title: "Article Two", views: 200 },
                    ],
                    ["Great post!", "Thanks"],
                )

                const loaded = await connection
                    .getRepository(Author)
                    .findOneBy({ name: "Alice" })

                expect(loaded).to.not.be.null
                expect(loaded!.articles).to.be.an("array")
                expect(loaded!.articles).to.have.length(2)
                expect(loaded!.comments).to.be.an("array")
                expect(loaded!.comments).to.have.length(2)

                const titles = loaded!.articles
                    .map((a) => a.title)
                    .sort()
                expect(titles).to.deep.equal([
                    "Article One",
                    "Article Two",
                ])

                const texts = loaded!.comments.map((c) => c.text).sort()
                expect(texts).to.deep.equal(["Great post!", "Thanks"])
            }),
        ))

    // =========================================================================
    // (2) Empty array: no related items
    // =========================================================================

    it("should return empty arrays for OneToMany eager relations when no related items exist", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(connection, "Bob", [], [])

                const loaded = await connection
                    .getRepository(Author)
                    .findOneBy({ name: "Bob" })

                expect(loaded).to.not.be.null
                expect(loaded!.articles).to.be.an("array")
                expect(loaded!.articles).to.have.length(0)
                expect(loaded!.comments).to.be.an("array")
                expect(loaded!.comments).to.have.length(0)
            }),
        ))

    // =========================================================================
    // (3) Nested eager: OneToMany items have their own eager OneToOne
    // =========================================================================

    it("should eagerly load nested relations through OneToMany (Article -> ArticleMeta)", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(
                    connection,
                    "Charlie",
                    [
                        { title: "Deep Dive", views: 500 },
                        { title: "Quick Tip", views: 50 },
                    ],
                    [],
                )

                const loaded = await connection
                    .getRepository(Author)
                    .findOneBy({ name: "Charlie" })

                expect(loaded).to.not.be.null
                expect(loaded!.articles).to.have.length(2)

                // Each article should have its meta eagerly loaded
                for (const article of loaded!.articles) {
                    expect(article.meta).to.not.be.undefined
                    expect(article.meta).to.not.be.null
                    expect(article.meta.views).to.be.a("number")
                }

                const viewCounts = loaded!.articles
                    .map((a) => a.meta.views)
                    .sort((a, b) => a - b)
                expect(viewCounts).to.deep.equal([50, 500])
            }),
        ))

    // =========================================================================
    // (4) Multiple OneToMany on same entity — no cross-contamination
    // =========================================================================

    it("should keep multiple OneToMany eager relations separate (articles vs comments)", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(
                    connection,
                    "Diana",
                    [{ title: "Only Article", views: 10 }],
                    [
                        "Comment 1",
                        "Comment 2",
                        "Comment 3",
                    ],
                )

                const loaded = await connection
                    .getRepository(Author)
                    .findOneBy({ name: "Diana" })

                expect(loaded).to.not.be.null
                expect(loaded!.articles).to.have.length(1)
                expect(loaded!.articles[0].title).to.equal("Only Article")
                expect(loaded!.comments).to.have.length(3)

                const texts = loaded!.comments.map((c) => c.text).sort()
                expect(texts).to.deep.equal([
                    "Comment 1",
                    "Comment 2",
                    "Comment 3",
                ])
            }),
        ))

    // =========================================================================
    // (5) Cross-contamination: multiple Authors with different items
    // =========================================================================

    it("should not cross-contaminate OneToMany relations between different parent entities", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(
                    connection,
                    "Eve",
                    [{ title: "Eve Article", views: 10 }],
                    ["Eve Comment"],
                )
                await createAuthorWithData(
                    connection,
                    "Frank",
                    [
                        { title: "Frank Article 1", views: 20 },
                        { title: "Frank Article 2", views: 30 },
                    ],
                    [],
                )

                const authors = await connection
                    .getRepository(Author)
                    .find({ order: { id: "ASC" } })

                expect(authors).to.have.length(2)

                // Eve: 1 article, 1 comment
                expect(authors[0].name).to.equal("Eve")
                expect(authors[0].articles).to.have.length(1)
                expect(authors[0].articles[0].title).to.equal("Eve Article")
                expect(authors[0].comments).to.have.length(1)
                expect(authors[0].comments[0].text).to.equal("Eve Comment")

                // Frank: 2 articles, 0 comments
                expect(authors[1].name).to.equal("Frank")
                expect(authors[1].articles).to.have.length(2)
                const frankTitles = authors[1].articles
                    .map((a) => a.title)
                    .sort()
                expect(frankTitles).to.deep.equal([
                    "Frank Article 1",
                    "Frank Article 2",
                ])
                expect(authors[1].comments).to.have.length(0)
            }),
        ))

    // =========================================================================
    // (6) Single item in OneToMany
    // =========================================================================

    it("should correctly load a single item in OneToMany eager relation", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(
                    connection,
                    "Grace",
                    [{ title: "Solo Article", views: 999 }],
                    [],
                )

                const loaded = await connection
                    .getRepository(Author)
                    .findOneBy({ name: "Grace" })

                expect(loaded).to.not.be.null
                expect(loaded!.articles).to.be.an("array")
                expect(loaded!.articles).to.have.length(1)
                expect(loaded!.articles[0].title).to.equal("Solo Article")
                expect(loaded!.articles[0].meta).to.not.be.null
                expect(loaded!.articles[0].meta.views).to.equal(999)
            }),
        ))

    // =========================================================================
    // (7) QueryBuilder should NOT eagerly load OneToMany
    // =========================================================================

    it("should NOT load eager OneToMany relations when using QueryBuilder", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(
                    connection,
                    "Hank",
                    [{ title: "QB Article", views: 1 }],
                    ["QB Comment"],
                )

                const loaded = await connection
                    .createQueryBuilder(Author, "author")
                    .where("author.name = :name", { name: "Hank" })
                    .getOne()

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Hank")
                // QueryBuilder does not load eager relations by default
                expect(loaded!.articles).to.be.undefined
                expect(loaded!.comments).to.be.undefined
            }),
        ))

    // =========================================================================
    // (8) Save and reload preserves OneToMany eager relations
    // =========================================================================

    it("should preserve OneToMany eager relations across save and reload cycle", () =>
        Promise.all(
            connections.map(async (connection) => {
                const author = await createAuthorWithData(
                    connection,
                    "Ivy",
                    [
                        { title: "First", views: 10 },
                        { title: "Second", views: 20 },
                    ],
                    ["Hello"],
                )

                // Reload from scratch
                const loaded = await connection
                    .getRepository(Author)
                    .findOneBy({ id: author.id })

                expect(loaded).to.not.be.null
                expect(loaded!.name).to.equal("Ivy")
                expect(loaded!.articles).to.have.length(2)
                expect(loaded!.comments).to.have.length(1)

                // Verify nested eager (ArticleMeta) also survived reload
                for (const article of loaded!.articles) {
                    expect(article.meta).to.not.be.null
                    expect(article.meta.views).to.be.a("number")
                }
            }),
        ))

    // =========================================================================
    // (9) find() with many authors — correct grouping
    // =========================================================================

    it("should correctly group OneToMany items when loading multiple parents via find()", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Create 3 authors with varying article counts
                await createAuthorWithData(
                    connection,
                    "Author-0",
                    [],
                    [],
                )
                await createAuthorWithData(
                    connection,
                    "Author-1",
                    [{ title: "A1-Art1", views: 1 }],
                    [],
                )
                await createAuthorWithData(
                    connection,
                    "Author-3",
                    [
                        { title: "A3-Art1", views: 1 },
                        { title: "A3-Art2", views: 2 },
                        { title: "A3-Art3", views: 3 },
                    ],
                    [],
                )

                const authors = await connection
                    .getRepository(Author)
                    .find({ order: { id: "ASC" } })

                expect(authors).to.have.length(3)
                expect(authors[0].articles).to.have.length(0)
                expect(authors[1].articles).to.have.length(1)
                expect(authors[2].articles).to.have.length(3)

                // Verify no item duplication or mixing
                expect(authors[1].articles[0].title).to.equal("A1-Art1")
                const a3Titles = authors[2].articles
                    .map((a) => a.title)
                    .sort()
                expect(a3Titles).to.deep.equal([
                    "A3-Art1",
                    "A3-Art2",
                    "A3-Art3",
                ])
            }),
        ))

    // =========================================================================
    // (10) Inverse side does NOT eagerly load back (no circular load)
    // =========================================================================

    it("should not create circular eager load from child back to parent", () =>
        Promise.all(
            connections.map(async (connection) => {
                await createAuthorWithData(
                    connection,
                    "Jack",
                    [{ title: "Jack Article", views: 42 }],
                    [],
                )

                // Load Article directly — author should NOT be eagerly loaded
                // because Article.author is ManyToOne without eager: true
                const article = await connection
                    .getRepository(Article)
                    .findOneBy({ title: "Jack Article" })

                expect(article).to.not.be.null
                expect(article!.title).to.equal("Jack Article")
                // meta IS eager on Article
                expect(article!.meta).to.not.be.null
                expect(article!.meta.views).to.equal(42)
                // author is NOT eager on Article
                expect(article!.author).to.be.undefined
            }),
        ))
})
