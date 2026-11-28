import { expect } from "chai"
import sinon from "sinon"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"

// Regression for #13078.
describe("query builder > soft-delete integer returning", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            enabledDrivers: ["postgres", "cockroachdb"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("matches missing, reordered and repeated inputs without exposing the internal ID", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const [first, second] = await repository.save([
                    { id: 1, version: 10 },
                    { id: 2, version: 20 },
                ])
                const missing = repository.create({ id: 3, version: 99 })
                const runner = dataSource.createQueryRunner()
                await runner.connect()
                const query = sinon.spy(runner, "query")
                try {
                    for (const restore of [false, true]) {
                        const builder = dataSource.createQueryBuilder(runner)
                        const result = await (
                            restore ? builder.restore() : builder.softDelete()
                        )
                            .from(Record)
                            .whereEntity([missing, second, first, first])
                            .execute()
                        expect(query.callCount).to.equal(1)
                        query.resetHistory()
                        expect(missing.version).to.equal(99)
                        expect(first.version).to.equal(restore ? 12 : 11)
                        expect(second.version).to.equal(restore ? 22 : 21)
                        expect(result.raw).to.have.length(2)
                        expect(result.generatedMaps).to.have.length(3)
                        for (const row of [
                            ...result.raw,
                            ...result.generatedMaps,
                        ]) {
                            expect(row).to.have.keys("version", "deletedAt")
                        }
                    }
                } finally {
                    query.restore()
                    await runner.release()
                }
            }),
        ))

    it("uses the bound ID after the input or WHERE changes, preserving explicitly returned IDs", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const [input, other] = await repository.save([
                    { id: 1, version: 10 },
                    { id: 2, version: 20 },
                ])
                const builder = dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(Record)
                    .whereEntity(input)
                    .where("id IN (:...ids)", { ids: [2, 1] })
                    .returning(["id", "version"])
                input.id = 42
                const result = await builder.execute()
                expect(input.id).to.equal(42)
                expect(input.version).to.equal(11)
                expect(other.version).to.equal(20)
                expect(result.raw.map((row: Record) => row.id)).to.have.members(
                    [1, 2],
                )
                expect(result.generatedMaps.map((row) => row.id)).to.deep.equal(
                    [1],
                )
            }),
        ))

    for (const batch of [false, true]) {
        it(`keeps original entity identities after rebinding a ${batch ? "batch" : "single"} query`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Record)
                    const [first, second] = await repository.save([
                        { id: 1, version: 10 },
                        { id: 2, version: 20 },
                    ])
                    const builder = dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(Record)
                        .whereEntity(batch ? [first, second] : first)
                    const query = batch ? builder.clone() : builder
                    const parameter = Object.keys(query.getParameters())[0]
                    const result = await query
                        .setParameter(parameter, second.id)
                        .execute()

                    expect(result.affected).to.equal(1)
                    expect(first.version).to.equal(10)
                    expect(second.version).to.equal(batch ? 21 : 20)
                    expect(result.generatedMaps).to.have.length(batch ? 1 : 0)
                    const saved = await repository.findOneByOrFail({
                        id: first.id,
                    })
                    expect(saved.version).to.equal(10)
                }),
            ))
    }

    it("keeps the implicit ID out of later executions with entity updates disabled", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const [first, second, third] = await repository.save([
                    { id: 1 },
                    { id: 2 },
                    { id: 3 },
                ])
                const builder = repository
                    .createQueryBuilder()
                    .softDelete()
                    .whereEntity(first)
                await builder.execute()

                const implicit = await builder
                    .updateEntity(false)
                    .whereEntity(second)
                    .execute()
                expect(implicit.raw).to.have.length(1)
                expect(implicit.raw[0]).to.have.keys("version", "deletedAt")

                const explicit = await builder
                    .whereEntity(third)
                    .returning(["id"])
                    .execute()
                expect(explicit.raw[0].id).to.equal(third.id)
            }),
        ))

    it("finishes refreshing the original input when the builder changes during execution", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const [first, second] = await repository.save([
                    { id: 1, version: 10 },
                    { id: 2, version: 20 },
                ])
                const builder = repository
                    .createQueryBuilder()
                    .softDelete()
                    .whereEntity(first)
                    .callListeners(false)
                // Without listeners, execute reaches the driver before yielding.
                const pending = builder.execute()
                builder
                    .updateEntity(false)
                    .whereEntity(second)
                    .from("other_table")
                const result = await pending

                expect(result.raw[0]).to.have.keys("version", "deletedAt")
                expect(first.version).to.equal(11)
                expect(second.version).to.equal(20)
            }),
        ))

    it("preserves custom string RETURNING", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const input = await repository.save({ id: 1 })
                const result = await dataSource
                    .createQueryBuilder()
                    .softDelete()
                    .from(Record)
                    .whereEntity(input)
                    .returning('id AS "customId"')
                    .execute()
                expect(result.raw).to.deep.equal([{ customId: 1 }])
            }),
        ))

    it("does not project or hydrate a transformed primary column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const inputs = await repository.save([{ id: 1 }, { id: 2 }])
                const primary = repository.metadata.primaryColumns[0]
                const previous = primary.transformer
                const from = sinon.spy((value: number) => value)
                primary.transformer = { from, to: (value: number) => value }
                try {
                    const result = await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(Record)
                        .whereEntity(inputs)
                        .execute()
                    expect(from.callCount).to.equal(0)
                    for (const row of [
                        ...result.raw,
                        ...result.generatedMaps,
                    ]) {
                        expect(row).not.to.have.property("id")
                    }
                } finally {
                    primary.transformer = previous
                }
            }),
        ))
})
