import "../../../utils/test-setup"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"

// Regression for https://github.com/typeorm/typeorm/issues/13004
describe("query builder > soft-delete with generated bigint keys", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres", "cockroachdb", "mssql"],
            entities: [Record],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should match numeric entity IDs without replacing them with returned strings", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const record = await repository.save(repository.create())
                record.id = Number(record.id)
                const originalId = record.id
                for (const operation of ["soft-delete", "restore"] as const) {
                    const builder = dataSource.createQueryBuilder()
                    await (
                        operation === "soft-delete"
                            ? builder.softDelete()
                            : builder.restore()
                    )
                        .from(Record)
                        .whereEntity(record)
                        .execute()
                    expect(record.id).to.equal(originalId)
                    const stored = await repository.findOneOrFail({
                        where: { id: originalId },
                        withDeleted: true,
                    })
                    expect(record.version).to.equal(stored.version)
                    expect(record.deletedAt === null).to.equal(
                        operation === "restore",
                    )
                }
            }),
        ))
})
