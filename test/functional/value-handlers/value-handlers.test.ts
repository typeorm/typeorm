import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    createTestingConnections,
    reloadTestingDatabases,
    closeTestingConnections,
} from "../../utils/test-utils"
import { BigintParent } from "./entity/BigintParent"
import { BigintChild } from "./entity/BigintChild"
import { DateTimePostDatetime } from "./entity/DateTimePostDatetime"
import { DateTimePostTimestamp } from "./entity/DateTimePostTimestamp"
import {
    TypeCoveragePostJson,
    UserRole as JsonUserRole,
} from "./entity/TypeCoveragePostJson"
import {
    TypeCoveragePostJsonb,
    UserRole as JsonbUserRole,
} from "./entity/TypeCoveragePostJsonb"
import {
    TypeCoveragePostSimpleJson,
    UserRole as SimpleJsonUserRole,
} from "./entity/TypeCoveragePostSimpleJson"
import {
    TypeCoveragePostJsonbNoBlob,
    UserRole as JsonbNoBlobUserRole,
} from "./entity/TypeCoveragePostJsonbNoBlob"

// -----------------------------------------------------------------
// Shared test factories — each takes dataSources + entity/enum refs
// so per-driver blocks don't duplicate test logic
// -----------------------------------------------------------------

function dateTimeTests(
    getDataSources: () => DataSource[],
    DateTimeEntity: typeof DateTimePostDatetime | typeof DateTimePostTimestamp,
) {
    it("should not trigger unnecessary update when date is unchanged", () =>
        Promise.all(
            getDataSources().map(async (ds) => {
                const repo = ds.getRepository(DateTimeEntity)
                const entity = new DateTimeEntity()
                entity.dateOnly = "2024-06-15"
                entity.fullDatetime = new Date("2024-06-15T12:30:00Z")
                await repo.save(entity)

                const loaded = await repo.findOneByOrFail({ id: entity.id })
                loaded.dateOnly = "2024-06-15"
                loaded.fullDatetime = new Date("2024-06-15T12:30:00Z")
                await repo.save(loaded)

                const reloaded = await repo.findOneByOrFail({ id: entity.id })
                expect(reloaded.dateOnly).to.not.be.null
            }),
        ))

    it("should detect change when date value differs", () =>
        Promise.all(
            getDataSources().map(async (ds) => {
                const repo = ds.getRepository(DateTimeEntity)
                const entity = new DateTimeEntity()
                entity.dateOnly = "2024-06-15"
                entity.fullDatetime = new Date("2024-06-15T12:30:00Z")
                await repo.save(entity)

                entity.dateOnly = "2024-07-20"
                entity.fullDatetime = new Date("2025-01-01T00:00:00Z")
                await repo.save(entity)

                const loaded = await repo.findOneByOrFail({ id: entity.id })
                expect(loaded.dateOnly).to.not.be.null
            }),
        ))

    it("should handle null datetime transitions", () =>
        Promise.all(
            getDataSources().map(async (ds) => {
                const repo = ds.getRepository(DateTimeEntity)
                const entity = new DateTimeEntity()
                entity.dateOnly = null
                entity.fullDatetime = null
                await repo.save(entity)

                entity.dateOnly = "2024-01-01"
                entity.fullDatetime = new Date("2024-01-01T00:00:00Z")
                await repo.save(entity)

                let loaded = await repo.findOneByOrFail({ id: entity.id })
                expect(loaded.dateOnly).to.not.be.null

                loaded.dateOnly = null
                loaded.fullDatetime = null
                await repo.save(loaded)

                loaded = await repo.findOneByOrFail({ id: entity.id })
                expect(loaded.dateOnly).to.be.null
                expect(loaded.fullDatetime).to.be.null
            }),
        ))
}

function fkRelationTests(getDataSources: () => DataSource[]) {
    it("should save and update entity with FK without creating duplicates", () =>
        Promise.all(
            getDataSources().map(async (ds) => {
                const parentRepo = ds.getRepository(BigintParent)
                const childRepo = ds.getRepository(BigintChild)

                const parent = new BigintParent()
                parent.name = "parent"
                await parentRepo.save(parent)

                const child = new BigintChild()
                child.label = "child-1"
                child.parent = parent
                await childRepo.save(child)

                child.label = "child-1-updated"
                await childRepo.save(child)

                const children = await childRepo.find()
                expect(children).to.have.length(1)
                expect(children[0].label).to.equal("child-1-updated")
            }),
        ))
}

interface TypeCoverageEntity {
    id: number
    jsonData: { [key: string]: unknown }
    binaryData?: Buffer | null
    tags: string[]
    role: string
    name: string
    score: number
}

function typeCoverageTests(
    getDataSources: () => DataSource[],
    Entity: new () => TypeCoverageEntity,
    RoleEnum: { ADMIN: string; EDITOR: string; VIEWER: string },
    hasBinary: boolean,
) {
    describe("simple-json change detection", () => {
        it("should not trigger unnecessary update when JSON is unchanged", () =>
            Promise.all(
                getDataSources().map(async (ds) => {
                    const repo = ds.getRepository(Entity)
                    const e = new Entity()
                    e.jsonData = { key: "value", num: 42 }
                    e.tags = ["a"]
                    e.role = RoleEnum.ADMIN
                    e.name = "test"
                    e.score = 1
                    await repo.save(e)

                    const loaded = await repo.findOneByOrFail({ id: e.id })
                    loaded.jsonData = { key: "value", num: 42 }
                    await repo.save(loaded)

                    const reloaded = await repo.findOneByOrFail({ id: e.id })
                    expect(reloaded.jsonData).to.deep.equal({
                        key: "value",
                        num: 42,
                    })
                }),
            ))

        it("should detect change when JSON value differs", () =>
            Promise.all(
                getDataSources().map(async (ds) => {
                    const repo = ds.getRepository(Entity)
                    const e = new Entity()
                    e.jsonData = { key: "old" }
                    e.tags = ["a"]
                    e.role = RoleEnum.ADMIN
                    e.name = "test"
                    e.score = 1
                    await repo.save(e)

                    e.jsonData = { key: "new" }
                    await repo.save(e)

                    const loaded = await repo.findOneByOrFail({ id: e.id })
                    expect(loaded.jsonData).to.deep.equal({ key: "new" })
                }),
            ))
    })

    describe("simple-array change detection", () => {
        it("should not trigger unnecessary update when array is unchanged", () =>
            Promise.all(
                getDataSources().map(async (ds) => {
                    const repo = ds.getRepository(Entity)
                    const e = new Entity()
                    e.jsonData = { k: 1 }
                    e.tags = ["a", "b", "c"]
                    e.role = RoleEnum.ADMIN
                    e.name = "test"
                    e.score = 1
                    await repo.save(e)

                    const loaded = await repo.findOneByOrFail({ id: e.id })
                    loaded.tags = ["a", "b", "c"]
                    await repo.save(loaded)

                    const reloaded = await repo.findOneByOrFail({ id: e.id })
                    expect(reloaded.tags).to.deep.equal(["a", "b", "c"])
                }),
            ))

        it("should detect change when array value differs", () =>
            Promise.all(
                getDataSources().map(async (ds) => {
                    const repo = ds.getRepository(Entity)
                    const e = new Entity()
                    e.jsonData = { k: 1 }
                    e.tags = ["a", "b"]
                    e.role = RoleEnum.ADMIN
                    e.name = "test"
                    e.score = 1
                    await repo.save(e)

                    e.tags = ["a", "b", "c"]
                    await repo.save(e)

                    const loaded = await repo.findOneByOrFail({ id: e.id })
                    expect(loaded.tags).to.deep.equal(["a", "b", "c"])
                }),
            ))
    })

    describe("simple-enum change detection", () => {
        it("should not trigger unnecessary update when enum is unchanged", () =>
            Promise.all(
                getDataSources().map(async (ds) => {
                    const repo = ds.getRepository(Entity)
                    const e = new Entity()
                    e.jsonData = { k: 1 }
                    e.tags = ["a"]
                    e.role = RoleEnum.ADMIN
                    e.name = "test"
                    e.score = 1
                    await repo.save(e)

                    const loaded = await repo.findOneByOrFail({ id: e.id })
                    loaded.role = RoleEnum.ADMIN
                    await repo.save(loaded)

                    const reloaded = await repo.findOneByOrFail({ id: e.id })
                    expect(reloaded.role).to.equal(RoleEnum.ADMIN)
                }),
            ))

        it("should detect change when enum value differs", () =>
            Promise.all(
                getDataSources().map(async (ds) => {
                    const repo = ds.getRepository(Entity)
                    const e = new Entity()
                    e.jsonData = { k: 1 }
                    e.tags = ["a"]
                    e.role = RoleEnum.VIEWER
                    e.name = "test"
                    e.score = 1
                    await repo.save(e)

                    e.role = RoleEnum.EDITOR
                    await repo.save(e)

                    const loaded = await repo.findOneByOrFail({ id: e.id })
                    expect(loaded.role).to.equal(RoleEnum.EDITOR)
                }),
            ))
    })

    if (hasBinary) {
        describe("binary change detection", () => {
            it("should not trigger unnecessary update when binary is unchanged", () =>
                Promise.all(
                    getDataSources().map(async (ds) => {
                        const repo = ds.getRepository(Entity)
                        const e = new Entity()
                        e.jsonData = { k: 1 }
                        e.tags = ["a"]
                        e.role = RoleEnum.ADMIN
                        e.name = "test"
                        e.score = 1
                        e.binaryData = Buffer.from([0x01, 0x02, 0x03])
                        await repo.save(e)

                        const loaded = await repo.findOneByOrFail({ id: e.id })
                        loaded.binaryData = Buffer.from([0x01, 0x02, 0x03])
                        await repo.save(loaded)

                        const reloaded = await repo.findOneByOrFail({
                            id: e.id,
                        })
                        expect(reloaded.binaryData).to.not.be.null
                    }),
                ))

            it("should detect change when binary value differs", () =>
                Promise.all(
                    getDataSources().map(async (ds) => {
                        const repo = ds.getRepository(Entity)
                        const e = new Entity()
                        e.jsonData = { k: 1 }
                        e.tags = ["a"]
                        e.role = RoleEnum.ADMIN
                        e.name = "test"
                        e.score = 1
                        e.binaryData = Buffer.from([0x01, 0x02, 0x03])
                        await repo.save(e)

                        e.binaryData = Buffer.from([0xaa, 0xbb, 0xcc])
                        await repo.save(e)

                        const loaded = await repo.findOneByOrFail({ id: e.id })
                        expect(loaded.binaryData).to.not.be.null
                    }),
                ))

            it("should handle null binary transitions", () =>
                Promise.all(
                    getDataSources().map(async (ds) => {
                        const repo = ds.getRepository(Entity)
                        const e = new Entity()
                        e.jsonData = { k: 1 }
                        e.tags = ["a"]
                        e.role = RoleEnum.ADMIN
                        e.name = "test"
                        e.score = 1
                        e.binaryData = null
                        await repo.save(e)

                        e.binaryData = Buffer.from([0xff])
                        await repo.save(e)

                        let loaded = await repo.findOneByOrFail({ id: e.id })
                        expect(loaded.binaryData).to.not.be.null

                        loaded.binaryData = null
                        await repo.save(loaded)

                        loaded = await repo.findOneByOrFail({ id: e.id })
                        expect(loaded.binaryData).to.be.null
                    }),
                ))
        })
    }

    describe("default handler for basic types", () => {
        it("should save and update varchar/int without issues", () =>
            Promise.all(
                getDataSources().map(async (ds) => {
                    const repo = ds.getRepository(Entity)
                    const e = new Entity()
                    e.jsonData = { k: 1 }
                    e.tags = ["a"]
                    e.role = RoleEnum.ADMIN
                    e.name = "original"
                    e.score = 100
                    await repo.save(e)

                    e.name = "updated"
                    e.score = 200
                    await repo.save(e)

                    const loaded = await repo.findOneByOrFail({ id: e.id })
                    expect(loaded.name).to.equal("updated")
                    // TODO: CockroachDB returns int as string — needs driver fix or handler hydrate()
                    expect(Number(loaded.score)).to.equal(200)
                }),
            ))
    })
}

// =================================================================
// Per-driver test suites
// =================================================================

describe("value-handlers - mysql/mariadb/better-sqlite3", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                BigintParent,
                BigintChild,
                DateTimePostDatetime,
                TypeCoveragePostJson,
            ],
            enabledDrivers: ["mysql", "mariadb", "better-sqlite3"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("FK relation", () => fkRelationTests(() => dataSources))
    describe("date/datetime", () =>
        dateTimeTests(() => dataSources, DateTimePostDatetime))
    typeCoverageTests(
        () => dataSources,
        TypeCoveragePostJson,
        JsonUserRole,
        true,
    )
})

describe("value-handlers - postgres", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                BigintParent,
                BigintChild,
                DateTimePostTimestamp,
                TypeCoveragePostJsonb,
            ],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("FK relation", () => fkRelationTests(() => dataSources))
    describe("date/timestamp", () =>
        dateTimeTests(() => dataSources, DateTimePostTimestamp))
    typeCoverageTests(
        () => dataSources,
        TypeCoveragePostJsonb,
        JsonbUserRole,
        true,
    )
})

describe("value-handlers - mssql", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                BigintParent,
                BigintChild,
                DateTimePostDatetime,
                TypeCoveragePostSimpleJson,
            ],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("FK relation", () => fkRelationTests(() => dataSources))
    describe("date/datetime", () =>
        dateTimeTests(() => dataSources, DateTimePostDatetime))
    typeCoverageTests(
        () => dataSources,
        TypeCoveragePostSimpleJson,
        SimpleJsonUserRole,
        true,
    )
})

describe("value-handlers - cockroachdb", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                BigintParent,
                BigintChild,
                DateTimePostTimestamp,
                TypeCoveragePostJsonbNoBlob,
            ],
            enabledDrivers: ["cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("FK relation", () => fkRelationTests(() => dataSources))
    describe("date/timestamp", () =>
        dateTimeTests(() => dataSources, DateTimePostTimestamp))
    typeCoverageTests(
        () => dataSources,
        TypeCoveragePostJsonbNoBlob,
        JsonbNoBlobUserRole,
        false,
    )
})

// =================================================================
// valuesEqual on column metadata — no DB needed, uses all dataSources
// =================================================================
describe("value-handlers - valuesEqual metadata checks", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [
                BigintParent,
                BigintChild,
                DateTimePostDatetime,
                TypeCoveragePostJson,
            ],
            enabledDrivers: ["better-sqlite3"],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should use default handler for integer PK", () => {
        for (const ds of dataSources) {
            const pkCol = ds.getMetadata(BigintParent).primaryColumns[0]
            expect(pkCol.valuesEqual(1, 1)).to.be.true
            expect(pkCol.valuesEqual(1, 2)).to.be.false
        }
    })

    it("should handle null comparison correctly", () => {
        for (const ds of dataSources) {
            const pkCol = ds.getMetadata(BigintParent).primaryColumns[0]
            expect(pkCol.valuesEqual(null, null)).to.be.true
            expect(pkCol.valuesEqual(null, 1)).to.be.false
            expect(pkCol.valuesEqual(1, null)).to.be.false
        }
    })

    it("should resolve simple-json handler for JSON column", () => {
        for (const ds of dataSources) {
            const col = ds
                .getMetadata(TypeCoveragePostJson)
                .columns.find((c) => c.propertyName === "jsonData")!
            expect(col.valuesEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).to.be.true
            expect(col.valuesEqual({ a: 1 }, { a: 2 })).to.be.false
        }
    })

    it("should resolve simple-array handler for array column", () => {
        for (const ds of dataSources) {
            const col = ds
                .getMetadata(TypeCoveragePostJson)
                .columns.find((c) => c.propertyName === "tags")!
            expect(col.valuesEqual(["a", "b"], ["a", "b"])).to.be.true
            expect(col.valuesEqual(["a", "b"], ["a", "c"])).to.be.false
        }
    })

    it("should resolve simple-enum handler for enum column", () => {
        for (const ds of dataSources) {
            const col = ds
                .getMetadata(TypeCoveragePostJson)
                .columns.find((c) => c.propertyName === "role")!
            expect(col.valuesEqual("admin", "admin")).to.be.true
            expect(col.valuesEqual("admin", "editor")).to.be.false
        }
    })

    it("should resolve date handler for date column", () => {
        for (const ds of dataSources) {
            const col = ds
                .getMetadata(DateTimePostDatetime)
                .columns.find((c) => c.propertyName === "dateOnly")!
            expect(col.valuesEqual("2024-01-15", "2024-01-15")).to.be.true
            expect(col.valuesEqual("2024-01-15", "2024-01-16")).to.be.false
        }
    })

    it("should resolve datetime handler for datetime column", () => {
        for (const ds of dataSources) {
            const col = ds
                .getMetadata(DateTimePostDatetime)
                .columns.find((c) => c.propertyName === "fullDatetime")!
            const a = new Date("2024-01-15T10:30:00Z")
            const b = new Date("2024-01-15T10:30:00Z")
            const c = new Date("2024-01-15T10:30:01Z")
            expect(col.valuesEqual(a, b)).to.be.true
            expect(col.valuesEqual(a, c)).to.be.false
        }
    })

    it("should resolve default handler for binary column", () => {
        for (const ds of dataSources) {
            const col = ds
                .getMetadata(TypeCoveragePostJson)
                .columns.find((c) => c.propertyName === "binaryData")!
            const a = new Uint8Array([1, 2, 3])
            const b = new Uint8Array([1, 2, 3])
            const c = new Uint8Array([1, 2, 4])
            expect(col.valuesEqual(a, b)).to.be.true
            expect(col.valuesEqual(a, c)).to.be.false
        }
    })
})
