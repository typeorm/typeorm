import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"
import { DataSource } from "../../../src/data-source/DataSource"
import { EntitySchema } from "../../../src/entity-schema/EntitySchema"
import { RelationIdLoader } from "../../../src/query-builder/RelationIdLoader"

describe("RelationIdLoader > loadManyToManyRelationIdsAndGroup", () => {
    afterEach(() => sinon.restore())

    const createOneToManyDataSource = async () => {
        interface AuthorEntity {
            id: number
            name: string
            books: BookEntity[]
        }
        interface BookEntity {
            id: number
            title: string
            authorId: number
            author: AuthorEntity
        }
        const Author = new EntitySchema<AuthorEntity>({
            name: "Author",
            columns: {
                id: { type: Number, primary: true },
                name: { type: String },
            },
            relations: {
                books: {
                    type: "one-to-many",
                    target: "Book",
                    inverseSide: "author",
                },
            },
        })
        const Book = new EntitySchema<BookEntity>({
            name: "Book",
            columns: {
                id: { type: Number, primary: true },
                title: { type: String },
                authorId: { type: Number },
            },
            relations: {
                author: {
                    type: "many-to-one",
                    target: "Author",
                    joinColumn: { name: "authorId" },
                },
            },
        })
        const dataSource = new DataSource({
            type: "postgres",
            entities: [Author, Book],
        })
        await (dataSource as any).buildMetadatas()
        return dataSource
    }

    it("should preserve relatedEntities ordering even when relationIds are returned in reverse order", async () => {
        const dataSource = await createOneToManyDataSource()
        const relation = dataSource
            .getMetadata("Author")
            .findRelationWithPropertyPath("books")!
        const loader = new RelationIdLoader(dataSource)

        const author = { id: 1, name: "A1" }
        const books = [
            { id: 10, title: "first", authorId: 1 },
            { id: 20, title: "second", authorId: 1 },
            { id: 30, title: "third", authorId: 1 },
        ]
        // relationIds returned in reverse order compared to relatedEntities
        sinon.stub(loader, "load").resolves([
            { Author_id: 1, Book_books_id: 30 },
            { Author_id: 1, Book_books_id: 10 },
            { Author_id: 1, Book_books_id: 20 },
        ])

        const groups = await loader.loadManyToManyRelationIdsAndGroup(
            relation,
            [author],
            books,
        )

        expect(groups).to.have.length(1)
        expect(groups[0].entity).to.equal(author)
        expect(groups[0].related).to.deep.equal(books)
    })

    it("should distinguish numeric and string keys, match Uint8Array by bytes, and support custom .equals()", async () => {
        const dataSource = await createOneToManyDataSource()
        const relation = dataSource
            .getMetadata("Author")
            .findRelationWithPropertyPath("books")!
        const loader = new RelationIdLoader(dataSource)

        class CustomKey {
            constructor(public readonly value: string) {}
            equals(other: unknown) {
                return (
                    other === this.value ||
                    (other instanceof CustomKey && other.value === this.value)
                )
            }
        }

        const numAuthor = { id: 1 as any, name: "num" }
        const strAuthor = { id: "1" as any, name: "str" }
        const binAuthor = {
            id: new Uint8Array([0xde, 0xad]) as any,
            name: "bin",
        }
        const nanAuthor = { id: Number.NaN as any, name: "nan" }
        const negZeroAuthor = { id: -0 as any, name: "negZero" }
        const customAuthor = { id: new CustomKey("abc") as any, name: "custom" }

        const bookNum = { id: 100 as any, title: "num" }
        const bookStr = { id: "100" as any, title: "str" }
        const bookBin = {
            id: new Uint8Array([0xbe, 0xef]) as any,
            title: "bin",
        }
        const bookZero = { id: 0 as any, title: "zero" }
        const bookCustom = {
            id: new CustomKey("book-1") as any,
            title: "custom",
        }

        sinon.stub(loader, "load").resolves([
            { Author_id: 1, Book_books_id: 100 },
            { Author_id: "1", Book_books_id: "100" },
            {
                Author_id: new Uint8Array([0xde, 0xad]),
                Book_books_id: new Uint8Array([0xbe, 0xef]),
            },
            { Author_id: Number.NaN, Book_books_id: 100 },
            { Author_id: 0, Book_books_id: -0 },
            { Author_id: "abc", Book_books_id: "book-1" },
        ])

        const groups = await loader.loadManyToManyRelationIdsAndGroup(
            relation,
            [
                numAuthor,
                strAuthor,
                binAuthor,
                nanAuthor,
                negZeroAuthor,
                customAuthor,
            ],
            [bookNum, bookStr, bookBin, bookZero, bookCustom],
        )

        expect(groups[0].related).to.deep.equal([bookNum])
        expect(groups[1].related).to.deep.equal([bookStr])
        expect(groups[2].related).to.deep.equal([bookBin])
        expect(groups[3].related).to.deep.equal([])
        expect(groups[4].related).to.deep.equal([bookZero])
        expect(groups[5].related).to.deep.equal([bookCustom])
    })

    it("should handle composite keys without collisions", async () => {
        interface ParentEntity {
            tenantId: string
            code: string
            children: ChildEntity[]
        }
        interface ChildEntity {
            id: number
            tenantId: string
            code: string
            parent: ParentEntity
        }
        const Parent = new EntitySchema<ParentEntity>({
            name: "Parent",
            columns: {
                tenantId: { type: String, primary: true },
                code: { type: String, primary: true },
            },
            relations: {
                children: {
                    type: "one-to-many",
                    target: "Child",
                    inverseSide: "parent",
                },
            },
        })
        const Child = new EntitySchema<ChildEntity>({
            name: "Child",
            columns: {
                id: { type: Number, primary: true },
                tenantId: { type: String },
                code: { type: String },
            },
            relations: {
                parent: {
                    type: "many-to-one",
                    target: "Parent",
                    joinColumn: [
                        { name: "tenantId", referencedColumnName: "tenantId" },
                        { name: "code", referencedColumnName: "code" },
                    ],
                },
            },
        })
        const dataSource = new DataSource({
            type: "postgres",
            entities: [Parent, Child],
        })
        await (dataSource as any).buildMetadatas()
        const relation = dataSource
            .getMetadata("Parent")
            .findRelationWithPropertyPath("children")!
        const loader = new RelationIdLoader(dataSource)

        const p1 = { tenantId: "a_b", code: "c" }
        const p2 = { tenantId: "a", code: "b_c" }
        const c1 = { id: 1 }
        const c2 = { id: 2 }

        sinon.stub(loader, "load").resolves([
            { Parent_tenantId: "a_b", Parent_code: "c", Child_children_id: 1 },
            { Parent_tenantId: "a", Parent_code: "b_c", Child_children_id: 2 },
        ])

        const groups = await loader.loadManyToManyRelationIdsAndGroup(
            relation,
            [p1, p2],
            [c1, c2],
        )

        expect(groups[0].related).to.deep.equal([c1])
        expect(groups[1].related).to.deep.equal([c2])
    })

    it("should group thousands of entities in linear time", async () => {
        const dataSource = await createOneToManyDataSource()
        const relation = dataSource
            .getMetadata("Author")
            .findRelationWithPropertyPath("books")!
        const loader = new RelationIdLoader(dataSource)

        const count = 5000
        const authors = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `A${i + 1}`,
        }))
        const books = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            title: `B${i + 1}`,
            authorId: i + 1,
        }))
        const relationIds = Array.from({ length: count }, (_, i) => ({
            Author_id: i + 1,
            Book_books_id: i + 1,
        }))
        sinon.stub(loader, "load").resolves(relationIds)

        const groups = await loader.loadManyToManyRelationIdsAndGroup(
            relation,
            authors,
            books,
        )

        expect(groups).to.have.length(count)
        expect(groups[0].related).to.deep.equal([books[0]])
        expect(groups[count - 1].related).to.deep.equal([books[count - 1]])
    })

    it("should preserve order and multiplicity in linear time when one parent has many related rows", async () => {
        const dataSource = await createOneToManyDataSource()
        const relation = dataSource
            .getMetadata("Author")
            .findRelationWithPropertyPath("books")!
        const loader = new RelationIdLoader(dataSource)

        const author = { id: 1, name: "Prolific" }
        const count = 3000
        const books = Array.from({ length: count }, (_, i) => ({
            id: count - i,
            title: `B${count - i}`,
            authorId: 1,
        }))
        // Return relationIds in ascending order while books are in descending order,
        // plus one duplicate link for book id 1.
        const relationIds = [
            ...Array.from({ length: count }, (_, i) => ({
                Author_id: 1,
                Book_books_id: i + 1,
            })),
            { Author_id: 1, Book_books_id: 1 },
        ]
        sinon.stub(loader, "load").resolves(relationIds)

        const groups = await loader.loadManyToManyRelationIdsAndGroup(
            relation,
            [author],
            books,
        )

        expect(groups).to.have.length(1)
        const related = groups[0].related as typeof books
        expect(related).to.have.length(count + 1)
        expect(related[0]).to.equal(books[0])
        expect(related[count - 1]).to.equal(books[count - 1])
        expect(related[count]).to.equal(books[count - 1])
    })

    it("should preserve to-one last-match semantics", async () => {
        const dataSource = await createOneToManyDataSource()
        const relation = dataSource
            .getMetadata("Book")
            .findRelationWithPropertyPath("author")!
        const loader = new RelationIdLoader(dataSource)

        const book = { id: 10, title: "B10", authorId: 1 }
        const authorFirst = { id: 1, name: "first" }
        const authorSecond = { id: 1, name: "second" }
        sinon
            .stub(loader, "load")
            .resolves([{ Book_id: 10, Author_author_id: 1 }])

        const groups = await loader.loadManyToManyRelationIdsAndGroup(
            relation,
            [book],
            [authorFirst, authorSecond],
        )

        expect(groups).to.have.length(1)
        expect(groups[0].related).to.equal(authorSecond)
    })
})
