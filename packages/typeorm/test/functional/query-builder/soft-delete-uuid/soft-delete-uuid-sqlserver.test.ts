import "../../../utils/test-setup"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    createDataSource,
    setupTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"
import { UniqueidentifierRecord } from "./entity/UniqueidentifierRecord"

// Regression for https://github.com/typeorm/typeorm/issues/13004
describe("query builder > soft-delete with SQL Server UUID keys", () => {
    for (const lowerCaseGuids of [false, true]) {
        describe(`when lowerCaseGuids is ${lowerCaseGuids}`, () => {
            let dataSources: DataSource[]
            before(async () => {
                dataSources = []
                const connectionOptions = setupTestingConnections({
                    enabledDrivers: ["mssql"],
                    entities: [Record, UniqueidentifierRecord],
                })
                for (const options of connectionOptions) {
                    if (options.type !== "mssql") continue
                    const dataSource = createDataSource({
                        ...options,
                        extra: {
                            ...options.extra,
                            options: {
                                ...options.options,
                                ...options.extra?.options,
                                lowerCaseGuids,
                            },
                        },
                    })
                    await dataSource.initialize()
                    dataSources.push(dataSource)
                }
            })
            beforeEach(() => reloadTestingDatabases(dataSources))
            after(() => closeTestingConnections(dataSources))

            for (const entity of [Record, UniqueidentifierRecord]) {
                it(`should match ${entity.name} without replacing the input ID`, () =>
                    Promise.all(
                        dataSources.map(async (dataSource) => {
                            const canonicalId =
                                "b1259bff-7f63-ee11-9937-6045bd9187cd"
                            const inputId = lowerCaseGuids
                                ? canonicalId.toUpperCase()
                                : canonicalId
                            const returnedId = lowerCaseGuids
                                ? canonicalId
                                : canonicalId.toUpperCase()
                            const repository = dataSource.getRepository(entity)
                            const record = await repository.save({
                                id: canonicalId,
                            })
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
                                    .from(entity)
                                    .whereEntity(record)
                                    .execute()

                                const stored = await repository.findOneOrFail({
                                    where: { id: canonicalId },
                                    withDeleted: true,
                                })
                                expect(result.affected).to.equal(1)
                                expect(record.id).to.equal(inputId)
                                expect(record.version).to.equal(
                                    operation === "soft-delete" ? 2 : 3,
                                )
                                expect(record.version).to.equal(stored.version)
                                expect(record.deletedAt).to.deep.equal(
                                    stored.deletedAt,
                                )
                                expect(result.generatedMaps).to.have.lengthOf(1)
                                expect(result.generatedMaps[0].id).to.equal(
                                    returnedId,
                                )
                            }
                        }),
                    ))
            }
        })
    }
})
