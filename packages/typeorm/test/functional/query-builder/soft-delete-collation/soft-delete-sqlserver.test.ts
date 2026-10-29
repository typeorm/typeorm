import "../../../utils/test-setup"
import { expect } from "chai"
import { Raw } from "../../../../src"
import type { DataSource } from "../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"

// https://github.com/typeorm/typeorm/issues/13004
describe("query builder > soft-delete with SQL Server raw identities", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mssql"],
            entities: [Record],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should budget all parameters in custom identity predicates", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                // Four parameters per input fit UPDATE's limit, but not a single
                // matching query that also binds every captured primary key.
                const records = await repository.save(
                    Array.from({ length: 500 }, (_, index) => ({
                        id: String(index).padStart(4, "0"),
                    })),
                )
                const column = repository.metadata.primaryColumns[0]
                const originalTransformer = column.transformer
                let parameterIndex = 0
                column.transformer = {
                    to: (value: string) => {
                        const names = Array.from(
                            { length: 4 },
                            () => `identity_${parameterIndex++}`,
                        )
                        return Raw(
                            (alias) =>
                                `${alias} = CONCAT(${names.map((name) => `:${name}`).join(", ")})`,
                            Object.fromEntries(
                                names.map((name, index) => [
                                    name,
                                    value[index],
                                ]),
                            ),
                        )
                    },
                    from: (value) => value,
                }
                try {
                    const result = await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(Record)
                        .whereEntity(records)
                        .execute()
                    expect(result.affected).to.equal(records.length)
                    expect(result.generatedMaps).to.have.lengthOf(
                        records.length,
                    )
                    for (const record of records) {
                        expect(record.version).to.equal(2)
                        expect(record.deletedAt).to.be.instanceof(Date)
                    }
                } finally {
                    column.transformer = originalTransformer
                }
            }),
        ))

    it("should leave room for a large identity predicate when WHERE is replaced", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const records = await repository.save(
                    Array.from({ length: 1000 }, (_, index) => ({
                        id: String(index),
                    })),
                )
                const column = repository.metadata.primaryColumns[0]
                const originalTransformer = column.transformer
                column.transformer = {
                    to: (value: string) =>
                        Raw(
                            (alias) =>
                                `${alias} = :identity AND :identity IN (:...identities)`,
                            {
                                identity: value,
                                identities: Array(1499).fill(value),
                            },
                        ),
                    from: (value) => value,
                }
                try {
                    const result = await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(Record)
                        .whereEntity(records[0])
                        .where("1 = 1")
                        .execute()
                    expect(result.affected).to.equal(records.length)
                    expect(result.generatedMaps).to.have.lengthOf(1)
                    expect(records[0].version).to.equal(2)
                    expect(records[0].deletedAt).to.be.instanceof(Date)
                    expect(records[1].version).to.equal(1)
                } finally {
                    column.transformer = originalTransformer
                }
            }),
        ))
})
