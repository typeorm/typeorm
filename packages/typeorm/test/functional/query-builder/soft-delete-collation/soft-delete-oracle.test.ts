import "../../../utils/test-setup"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import type { OracleDriver } from "../../../../src/driver/oracle/OracleDriver"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { FixedRecord } from "./entity/FixedRecord"
import { NationalRecord } from "./entity/NationalRecord"

// https://github.com/typeorm/typeorm/issues/13004
describe("query builder > soft-delete with Oracle fixed character keys", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["oracle"],
            entities: [FixedRecord, NationalRecord],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    for (const target of [FixedRecord, NationalRecord]) {
        for (const input of ["Ab", " ", "éé"]) {
            it(`should match typed ${target.name} input ${JSON.stringify(input)} with native padding`, () =>
                Promise.all(
                    dataSources.map(async (dataSource) => {
                        const repository = dataSource.getRepository(target)
                        if (target === FixedRecord) {
                            await dataSource.query(
                                'ALTER TABLE "fixed_record" MODIFY ("id" CHAR(5 CHAR))',
                            )
                        }
                        const record = await repository.save({ id: input })
                        const duplicate = { ...record }
                        const column = repository.metadata.primaryColumns[0]
                        const originalTransformer = column.transformer
                        const oracle = (dataSource.driver as OracleDriver)
                            .oracle
                        column.transformer = {
                            to: (value) => ({
                                val: value,
                                type:
                                    target === FixedRecord
                                        ? oracle.DB_TYPE_CHAR
                                        : oracle.DB_TYPE_NCHAR,
                            }),
                            from: (value) => value,
                        }
                        try {
                            for (const restore of [false, true]) {
                                const builder = dataSource.createQueryBuilder()
                                const result = await (
                                    restore
                                        ? builder.restore()
                                        : builder.softDelete()
                                )
                                    .from(target)
                                    .whereEntity([record, duplicate])
                                    .execute()
                                expect(result.affected).to.equal(1)
                                expect(record.version).to.equal(restore ? 3 : 2)
                                expect(duplicate.version).to.equal(
                                    record.version,
                                )
                                expect(record.id).to.equal(input)
                                expect(record.deletedAt === null).to.equal(
                                    restore,
                                )
                            }
                        } finally {
                            column.transformer = originalTransformer
                        }
                    }),
                ))
        }
    }
})
