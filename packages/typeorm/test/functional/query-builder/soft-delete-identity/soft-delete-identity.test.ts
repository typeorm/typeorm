import "../../../utils/test-setup"
import { expect } from "chai"
import sinon from "sinon"
import { Raw, type DataSource } from "../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { CaseInsensitiveRecord } from "./entity/CaseInsensitiveRecord"
import { NormalizedRecord, normalizeId } from "./entity/NormalizedRecord"
import { NormalizedUuidRecord } from "./entity/NormalizedUuidRecord"

// https://github.com/typeorm/typeorm/issues/13004
describe("query builder > soft-delete with database-equivalent keys", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [
                CaseInsensitiveRecord,
                NormalizedRecord,
                NormalizedUuidRecord,
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve identity predicates returned as raw SQL by a transformer", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(NormalizedRecord)
                const records = await repository.save([
                    { id: "first", version: 1 },
                    { id: "second", version: 5 },
                ])
                const column = repository.metadata.primaryColumns[0]
                const originalTransformer = column.transformer
                let parameterIndex = 0
                column.transformer = {
                    to: (value) => {
                        const parameter = `identity_${parameterIndex++}`
                        return Raw(
                            (alias) => `${alias} = lower(:${parameter})`,
                            { [parameter]: value },
                        )
                    },
                    from: (value) => value,
                }
                records.forEach((record) => {
                    record.id = record.id.toUpperCase()
                })
                try {
                    await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(NormalizedRecord)
                        .whereEntity(records)
                        .execute()
                    expect(records.map((record) => record.version)).to.eql([
                        2, 6,
                    ])
                    expect(
                        records.every(
                            (record) => record.deletedAt instanceof Date,
                        ),
                    ).to.equal(true)
                } finally {
                    column.transformer = originalTransformer
                }
            }),
        ))

    it("should retain the original entity order when the caller mutates its array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(NormalizedRecord)
                const [first, second] = await repository.save([
                    { id: "first", version: 1 },
                    { id: "second", version: 5 },
                ])
                const records = [first, second]
                const builder = dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(NormalizedRecord)
                    .whereEntity(records)
                records.reverse()
                records.push({
                    id: "not-selected",
                    version: 10,
                    deletedAt: null,
                })
                await builder.execute()
                expect(first.version).to.equal(2)
                expect(second.version).to.equal(6)
                expect(records[2].version).to.equal(10)
                expect(records[2].deletedAt).to.equal(null)
            }),
        ))

    for (const target of [CaseInsensitiveRecord, NormalizedRecord]) {
        it(`should hydrate a single ${target.name} using database identity`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(target)
                    const record = await repository.save({ id: "example" })
                    record.id = "EXAMPLE"
                    for (const restore of [false, true]) {
                        const builder = dataSource.createQueryBuilder()
                        const result = await (
                            restore ? builder.restore() : builder.softDelete()
                        )
                            .from(target)
                            .whereEntity(record)
                            .execute()
                        expect(result.affected).to.equal(1)
                        expect(record.version).to.equal(restore ? 3 : 2)
                        expect(record.deletedAt === null).to.equal(restore)
                        expect(record.id).to.equal("EXAMPLE")
                    }
                }),
            ))

        it(`should match filtered, reordered and duplicate ${target.name} inputs`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(target)
                    const [first, second, skipped] = await repository.save([
                        { id: "first" },
                        { id: "second" },
                        { id: "skipped" },
                    ])
                    await repository.softDelete(skipped.id)
                    const duplicate = { ...first, id: "FIRST" }
                    second.id = "SECOND"
                    const result = await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(target)
                        .whereEntity([second, skipped, first, duplicate])
                        .execute()
                    expect(result.affected).to.equal(2)
                    for (const record of [first, second, duplicate]) {
                        expect(record.version).to.equal(2)
                        expect(record.deletedAt).to.be.instanceof(Date)
                    }
                    expect(skipped.version).to.equal(1)
                    expect(skipped.deletedAt).to.equal(null)
                    expect(duplicate.id).to.equal("FIRST")
                    expect(second.id).to.equal("SECOND")
                }),
            ))
    }

    it("should reuse the bound primary key without transforming it again", async () => {
        const transform = sinon.spy(normalizeId, "to")
        try {
            for (const dataSource of dataSources) {
                const repository = dataSource.getRepository(NormalizedRecord)
                const records = await repository.save([
                    { id: "first" },
                    { id: "second" },
                ])
                records.forEach((record) => {
                    record.id = record.id.toUpperCase()
                })
                transform.resetHistory()
                await dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(NormalizedRecord)
                    .whereEntity(records)
                    .execute()
                expect(transform.callCount).to.equal(2)
                expect(records.map((record) => record.version)).to.eql([2, 2])
            }
        } finally {
            transform.restore()
        }
    })

    for (const replaceWhere of [false, true]) {
        it(`should not assume one returned row belongs to the input after ${replaceWhere ? "where" : "orWhere"}`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(
                        CaseInsensitiveRecord,
                    )
                    const [input, other] = await repository.save([
                        { id: "input" },
                        { id: "other" },
                    ])
                    await repository.softDelete(input.id)
                    const builder = dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(CaseInsensitiveRecord)
                        .whereEntity(input)
                    if (replaceWhere) builder.where({ id: other.id })
                    else builder.orWhere({ id: other.id })
                    const result = await builder.execute()
                    expect(result.affected).to.equal(1)
                    expect(input.version).to.equal(1)
                    expect(input.deletedAt).to.equal(null)
                }),
            ))
    }

    it("should not mistake raw AND/OR precedence for a single-entity predicate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(
                    CaseInsensitiveRecord,
                )
                const [input, other] = await repository.save([
                    { id: "input" },
                    { id: "other" },
                ])
                await repository.softDelete(input.id)
                const result = await dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(CaseInsensitiveRecord)
                    .whereEntity(input)
                    .andWhere("1 = 1 OR id = :other", { other: other.id })
                    .execute()
                expect(result.affected).to.equal(1)
                expect(input.version).to.equal(1)
                expect(input.deletedAt).to.equal(null)
            }),
        ))

    it("should preserve identities when cloning or changing builder types", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(
                    CaseInsensitiveRecord,
                )
                const record = await repository.save({ id: "example" })
                record.id = "EXAMPLE"
                const builder = dataSource
                    .createQueryBuilder()
                    .update(CaseInsensitiveRecord)
                    .whereEntity(record)
                    .softDelete()
                    .clone()
                await builder.execute()
                expect(record.version).to.equal(2)
                expect(record.deletedAt).to.be.instanceof(Date)
                await builder.restore().clone().execute()
                expect(record.version).to.equal(3)
                expect(record.deletedAt).to.equal(null)
            }),
        ))

    it("should correlate normalizing UUID transformers before hydrating keys", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository =
                    dataSource.getRepository(NormalizedUuidRecord)
                const records = await repository.save([
                    { id: "b1259bff-7f63-ee11-9937-6045bd9187cd" },
                    { id: "a1259bff-7f63-ee11-9937-6045bd9187cd" },
                ])
                records.forEach((record) => {
                    record.id = record.id.toUpperCase()
                })
                await dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(NormalizedUuidRecord)
                    .whereEntity(records.reverse())
                    .execute()
                expect(records.map((record) => record.version)).to.eql([2, 2])
                expect(
                    records.every((record) => record.deletedAt instanceof Date),
                ).to.equal(true)
            }),
        ))

    for (const target of [CaseInsensitiveRecord, NormalizedRecord]) {
        it(`should batch database matching for ${target.name} without querying per entity`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(target)
                    const records = await repository.save(
                        Array.from({ length: 20 }, (_, index) => ({
                            id: `record-${index}`,
                        })),
                    )
                    records.forEach((record) => {
                        record.id = record.id.toUpperCase()
                    })
                    const queryRunner = dataSource.createQueryRunner()
                    await queryRunner.connect()
                    const query = sinon.spy(queryRunner, "query")
                    try {
                        await dataSource
                            .createQueryBuilder()
                            .softDelete()
                            .from(target)
                            .whereEntity(records.reverse())
                            .setQueryRunner(queryRunner)
                            .execute()
                        expect(query.callCount).to.equal(
                            target === CaseInsensitiveRecord ? 2 : 1,
                        )
                        expect(
                            records.every(
                                (record) =>
                                    record.version === 2 &&
                                    record.deletedAt instanceof Date,
                            ),
                        ).to.equal(true)
                    } finally {
                        query.restore()
                        await queryRunner.release()
                    }
                }),
            ))
    }
})
