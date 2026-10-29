import "../../../utils/test-setup"
import { expect } from "chai"
import type { DataSource } from "../../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Record } from "./entity/Record"

// https://github.com/typeorm/typeorm/issues/13004
describe("query builder > soft-delete with database collations", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["mssql", "oracle"],
            entities: [Record],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve collation and avoid collisions with table and column names", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(Record)
                const [first, second, skipped] = await repository.save([
                    { id: "first" },
                    { id: "second" },
                    { id: "skipped" },
                ])
                await repository.softDelete(skipped.id)
                const duplicate = { ...first, id: "FIRST" }
                second.id = "SECOND"
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.connect()
                const metadata = repository.metadata
                const originalTablePath = metadata.tablePath
                let sessionParameters: { parameter: string; value: string }[] =
                    []
                try {
                    if (dataSource.options.type === "oracle") {
                        sessionParameters = await queryRunner.query(
                            "SELECT parameter AS \"parameter\", value AS \"value\" FROM nls_session_parameters WHERE parameter IN ('NLS_COMP', 'NLS_SORT')",
                        )
                        await queryRunner.query(
                            "ALTER SESSION SET NLS_COMP = LINGUISTIC",
                        )
                        await queryRunner.query(
                            "ALTER SESSION SET NLS_SORT = BINARY_CI",
                        )
                    } else {
                        // Database-qualified SQL Server paths may omit the schema.
                        metadata.tablePath = dataSource.driver.buildTableName(
                            metadata.tableName,
                            undefined,
                            String(dataSource.options.database),
                        )
                    }
                    const result = await dataSource
                        .createQueryBuilder()
                        .softDelete()
                        .from(Record)
                        .whereEntity([second, skipped, first, duplicate])
                        .setQueryRunner(queryRunner)
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
                } finally {
                    metadata.tablePath = originalTablePath
                    for (const { parameter, value } of sessionParameters) {
                        await queryRunner.query(
                            `ALTER SESSION SET ${parameter} = ${value}`,
                        )
                    }
                    await queryRunner.release()
                }
            }),
        ))
})
