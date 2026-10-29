import "../../../utils/test-setup"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"
import { TransformedRecord } from "./entity/TransformedRecord"
import { CompositeRecord } from "./entity/CompositeRecord"

// Regression for https://github.com/typeorm/typeorm/issues/13004
describe("query builder > soft-delete with native UUID keys", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [Record, TransformedRecord, CompositeRecord],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const canonicalId = "b1259bff-7f63-ee11-9937-6045bd9187cd"
    for (const inputId of [
        canonicalId.toUpperCase(),
        `{${canonicalId.toUpperCase()}}`,
        canonicalId.replaceAll("-", ""),
        "b125-9bff-7f63-ee11-9937-6045-bd91-87cd",
    ]) {
        it(`should match UUID ${inputId} without replacing the entity's ID`, () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const repository = dataSource.getRepository(Record)
                    const record = await repository.save({ id: canonicalId })
                    record.id = inputId

                    for (const operation of [
                        "soft-delete",
                        "restore",
                    ] as const) {
                        const builder = dataSource.createQueryBuilder()
                        const result = await (
                            operation === "soft-delete"
                                ? builder.softDelete()
                                : builder.restore()
                        )
                            .from(Record)
                            .whereEntity(record)
                            .execute()

                        const stored = await repository.findOneOrFail({
                            where: { id: canonicalId },
                            withDeleted: true,
                        })
                        expect(result.affected).to.equal(1)
                        expect(stored.version).to.equal(
                            operation === "soft-delete" ? 2 : 3,
                        )
                        expect(record.version).to.equal(stored.version)
                        expect(record.deletedAt).to.deep.equal(stored.deletedAt)
                        expect(record.deletedAt === null).to.equal(
                            operation === "restore",
                        )
                        expect(record.id).to.equal(inputId)
                        expect(result.generatedMaps).to.have.lengthOf(1)
                        expect(result.generatedMaps[0].id).to.equal(canonicalId)
                    }
                }),
            ))
    }

    it("should match UUIDs in composite keys with Date values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(CompositeRecord)
                const partition = new Date("2026-01-01T00:00:00.000Z")
                const record = await repository.save({
                    id: canonicalId,
                    partition,
                })
                record.id = canonicalId.toUpperCase()

                for (const operation of ["soft-delete", "restore"] as const) {
                    const builder = dataSource.createQueryBuilder()
                    const result = await (
                        operation === "soft-delete"
                            ? builder.softDelete()
                            : builder.restore()
                    )
                        .from(CompositeRecord)
                        .whereEntity(record)
                        .execute()

                    const stored = await repository.findOneOrFail({
                        where: { id: canonicalId, partition },
                        withDeleted: true,
                    })
                    expect(result.affected).to.equal(1)
                    expect(result.generatedMaps).to.have.lengthOf(1)
                    expect(record.id).to.equal(canonicalId.toUpperCase())
                    expect(record.partition).to.equal(partition)
                    expect(record.version).to.equal(
                        operation === "soft-delete" ? 2 : 3,
                    )
                    expect(record.version).to.equal(stored.version)
                    expect(record.deletedAt).to.deep.equal(stored.deletedAt)
                }
            }),
        ))

    it("should preserve case-sensitive transformed UUID identities", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(TransformedRecord)
                const firstId = "AAAAAAAAAAAAAAAAAAAAAA=="
                const secondId = "aAAAAAAAAAAAAAAAAAAAAA=="
                const [first, second] = await repository.save([
                    { id: firstId, version: 1 },
                    { id: secondId, version: 5 },
                ])

                for (const operation of ["soft-delete", "restore"] as const) {
                    const builder = dataSource.createQueryBuilder()
                    const result = await (
                        operation === "soft-delete"
                            ? builder.softDelete()
                            : builder.restore()
                    )
                        .from(TransformedRecord)
                        .whereEntity([second, first])
                        .execute()

                    expect(result.affected).to.equal(2)
                    expect(result.generatedMaps).to.have.lengthOf(2)
                    expect(first.id).to.equal(firstId)
                    expect(second.id).to.equal(secondId)
                    expect(first.version).to.equal(
                        operation === "soft-delete" ? 2 : 3,
                    )
                    expect(second.version).to.equal(
                        operation === "soft-delete" ? 6 : 7,
                    )
                    for (const record of [first, second]) {
                        const stored = await repository.findOneOrFail({
                            where: { id: record.id },
                            withDeleted: true,
                        })
                        expect(record.version).to.equal(stored.version)
                        expect(record.deletedAt).to.deep.equal(stored.deletedAt)
                    }
                }
            }),
        ))
})
