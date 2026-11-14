import { expect } from "chai"
import "reflect-metadata"
import sinon from "sinon"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { ColumnMetadata } from "../../../../../src/metadata/ColumnMetadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { Device, Reading } from "./binary-key-entities"
import { createBinaryKeyEntities } from "./binary-key-entities"
import { Book } from "./entity/Book"
import { Chapter } from "./entity/Chapter"
import { Edition } from "./entity/Edition"
import { Isbn } from "./entity/Isbn"
import { Library } from "./entity/Library"
import { Tag } from "./entity/Tag"

const sorted = (values: string[]) =>
    [...values].sort((a, b) => a.localeCompare(b))

describe("relations > load-strategy > query > grouping related rows by parent", () => {
    afterEach(() => sinon.restore())

    describe("primitive keys", () => {
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

        const seedBooks = async (dataSource: DataSource) => {
            const manager = dataSource.manager
            const [central, north] = await manager.save(
                manager.create(Library, [
                    { name: "central" },
                    { name: "north" },
                    { name: "empty" },
                ]),
            )
            const [fiction, history, science] = await manager.save(
                manager.create(Tag, [
                    { name: "fiction" },
                    { name: "history" },
                    { name: "science" },
                    { name: "unused" },
                ]),
            )
            const [isbn1, isbn3] = await manager.save(
                manager.create(Isbn, [
                    { code: "isbn-1" },
                    { code: "isbn-3" },
                    { code: "isbn-orphan" },
                ]),
            )
            await manager.save(
                manager.create(Book, [
                    {
                        title: "b1",
                        library: central,
                        tags: [fiction, history],
                        isbn: isbn1,
                    },
                    {
                        title: "b2",
                        library: central,
                        tags: [science],
                        isbn: null,
                    },
                    {
                        title: "b3",
                        library: north,
                        tags: [fiction],
                        isbn: isbn3,
                    },
                    { title: "b4", library: null, tags: [], isbn: null },
                ]),
            )
        }

        const seedEditions = async (dataSource: DataSource) => {
            const manager = dataSource.manager
            const [atlas1, atlas2, botany1] = await manager.save(
                manager.create(Edition, [
                    { series: "atlas", volume: 1 },
                    { series: "atlas", volume: 2 },
                    { series: "botany", volume: 1 },
                ]),
            )
            await manager.save(
                manager.create(Chapter, [
                    { title: "c1", edition: atlas1 },
                    { title: "c2", edition: atlas2 },
                    { title: "c3", edition: atlas2 },
                    { title: "c4", edition: botany1 },
                ]),
            )
        }

        it("should give each owner its own many-to-many rows", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedBooks(dataSource)

                    const books = await dataSource.getRepository(Book).find({
                        relations: { tags: true },
                        relationLoadStrategy: "query",
                        order: { title: "ASC" },
                    })

                    expect(
                        books.map((book) => [
                            book.title,
                            sorted(book.tags.map((tag) => tag.name)),
                        ]),
                    ).to.deep.equal([
                        ["b1", ["fiction", "history"]],
                        ["b2", ["science"]],
                        ["b3", ["fiction"]],
                        ["b4", []],
                    ])
                }),
            ))

        it("should give each inverse side its own many-to-many rows", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedBooks(dataSource)

                    const tags = await dataSource.getRepository(Tag).find({
                        relations: { books: true },
                        relationLoadStrategy: "query",
                        order: { name: "ASC" },
                    })

                    expect(
                        tags.map((tag) => [
                            tag.name,
                            sorted(tag.books.map((book) => book.title)),
                        ]),
                    ).to.deep.equal([
                        ["fiction", ["b1", "b3"]],
                        ["history", ["b1"]],
                        ["science", ["b2"]],
                        ["unused", []],
                    ])
                }),
            ))

        it("should give each parent its own one-to-many rows", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedBooks(dataSource)

                    const libraries = await dataSource
                        .getRepository(Library)
                        .find({
                            relations: { books: true },
                            relationLoadStrategy: "query",
                            order: { name: "ASC" },
                        })

                    expect(
                        libraries.map((library) => [
                            library.name,
                            sorted(library.books.map((book) => book.title)),
                        ]),
                    ).to.deep.equal([
                        ["central", ["b1", "b2"]],
                        ["empty", []],
                        ["north", ["b3"]],
                    ])
                }),
            ))

        it("should give each owner its many-to-one row, and null for a null foreign key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedBooks(dataSource)

                    const books = await dataSource.getRepository(Book).find({
                        relations: { library: true },
                        relationLoadStrategy: "query",
                        order: { title: "ASC" },
                    })

                    expect(
                        books.map((book) => [
                            book.title,
                            book.library?.name ?? null,
                        ]),
                    ).to.deep.equal([
                        ["b1", "central"],
                        ["b2", "central"],
                        ["b3", "north"],
                        ["b4", null],
                    ])
                }),
            ))

        it("should give each side of a one-to-one its own row", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedBooks(dataSource)

                    const books = await dataSource.getRepository(Book).find({
                        relations: { isbn: true },
                        relationLoadStrategy: "query",
                        order: { title: "ASC" },
                    })
                    const isbns = await dataSource.getRepository(Isbn).find({
                        relations: { book: true },
                        relationLoadStrategy: "query",
                        order: { code: "ASC" },
                    })

                    expect(
                        books.map((book) => [
                            book.title,
                            book.isbn?.code ?? null,
                        ]),
                    ).to.deep.equal([
                        ["b1", "isbn-1"],
                        ["b2", null],
                        ["b3", "isbn-3"],
                        ["b4", null],
                    ])
                    expect(
                        isbns.map((isbn) => [
                            isbn.code,
                            isbn.book?.title ?? null,
                        ]),
                    ).to.deep.equal([
                        ["isbn-1", "b1"],
                        ["isbn-3", "b3"],
                        ["isbn-orphan", null],
                    ])
                }),
            ))

        it("should match every column of a composite key", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    await seedEditions(dataSource)

                    const editions = await dataSource
                        .getRepository(Edition)
                        .find({
                            relations: { chapters: true },
                            relationLoadStrategy: "query",
                            order: { series: "ASC", volume: "ASC" },
                        })

                    expect(
                        editions.map((edition) => [
                            `${edition.series}-${edition.volume}`,
                            sorted(
                                edition.chapters.map(
                                    (chapter) => chapter.title,
                                ),
                            ),
                        ]),
                    ).to.deep.equal([
                        ["atlas-1", ["c1"]],
                        ["atlas-2", ["c2", "c3"]],
                        ["botany-1", ["c4"]],
                    ])
                }),
            ))

        it("should match primitive keys without comparing every pair", async () => {
            await Promise.all(dataSources.map(seedBooks))
            const compareEntityValue = sinon.spy(
                ColumnMetadata.prototype,
                "compareEntityValue",
            )

            for (const dataSource of dataSources) {
                await dataSource.getRepository(Library).find({
                    relations: { books: { tags: true, isbn: true } },
                    relationLoadStrategy: "query",
                })
            }

            expect(compareEntityValue.called).to.equal(false)
        })
    })

    describe("binary keys", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = [
                ...(await createTestingConnections({
                    enabledDrivers: ["better-sqlite3", "sqljs"],
                    entities: createBinaryKeyEntities("blob"),
                    schemaCreate: true,
                    dropSchema: true,
                })),
                ...(await createTestingConnections({
                    enabledDrivers: ["postgres", "cockroachdb"],
                    entities: createBinaryKeyEntities("bytea"),
                    schemaCreate: true,
                    dropSchema: true,
                })),
            ]
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))

        const seedDevices = async (dataSource: DataSource) => {
            const devices = dataSource.getRepository<Device>("Device")
            const readings = dataSource.getRepository<Reading>("Reading")
            const [a, b] = await devices.save([
                { serial: Uint8Array.from([1, 2, 3, 4]), name: "a" },
                { serial: Uint8Array.from([1, 2, 3, 5]), name: "b" },
                { serial: Uint8Array.from([9, 9, 9, 9]), name: "c" },
            ])
            await readings.save([
                { label: "r1", device: a },
                { label: "r2", device: a },
                { label: "r3", device: b },
            ])
        }

        it("should fall back to comparing every pair, with the same results", async () => {
            await Promise.all(dataSources.map(seedDevices))
            const compareEntityValue = sinon.spy(
                ColumnMetadata.prototype,
                "compareEntityValue",
            )

            for (const dataSource of dataSources) {
                compareEntityValue.resetHistory()

                const devices = await dataSource
                    .getRepository<Device>("Device")
                    .find({
                        relations: { readings: true },
                        relationLoadStrategy: "query",
                        order: { name: "ASC" },
                    })
                const readings = await dataSource
                    .getRepository<Reading>("Reading")
                    .find({
                        relations: { device: true },
                        relationLoadStrategy: "query",
                        order: { label: "ASC" },
                    })

                expect(
                    devices.map((device) => [
                        device.name,
                        sorted(device.readings.map((reading) => reading.label)),
                    ]),
                ).to.deep.equal([
                    ["a", ["r1", "r2"]],
                    ["b", ["r3"]],
                    ["c", []],
                ])
                expect(
                    readings.map((reading) => [
                        reading.label,
                        reading.device?.name ?? null,
                    ]),
                ).to.deep.equal([
                    ["r1", "a"],
                    ["r2", "a"],
                    ["r3", "b"],
                ])
                expect(compareEntityValue.called).to.equal(true)
            }
        })
    })
})
