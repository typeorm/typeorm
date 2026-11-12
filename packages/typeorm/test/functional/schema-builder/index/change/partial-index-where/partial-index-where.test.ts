import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import { Table } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"
import { Habilitation } from "./entity/Habilitation"
import { Ledger } from "./entity/Ledger"
import { Membership } from "./entity/Membership"
import { Waybill } from "./entity/Waybill"

const loadTable = async (
    dataSource: DataSource,
    tableName: string,
): Promise<Table> => {
    const queryRunner = dataSource.createQueryRunner()
    try {
        return (await queryRunner.getTable(tableName))!
    } finally {
        await queryRunner.release()
    }
}

const createTableBefore = async (
    dataSource: DataSource,
    table: Table,
): Promise<void> => {
    const queryRunner = dataSource.createQueryRunner()
    try {
        await queryRunner.dropTable(table.name, true)
        await queryRunner.createTable(table)
    } finally {
        await queryRunner.release()
    }
}

const expectNoPendingQueries = async (
    dataSource: DataSource,
): Promise<void> => {
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log()
    expect(sqlInMemory.upQueries).to.eql([])
    expect(sqlInMemory.downQueries).to.eql([])
}

// https://github.com/typeorm/typeorm/issues/12988
describe("schema builder > index > change > partial index where", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Habilitation, Membership, Ledger, Waybill],
            enabledDrivers: [
                "better-sqlite3",
                "cockroachdb",
                "mssql",
                "postgres",
                "sqljs",
            ],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should recreate a named index when its condition appears", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const table = Table.create(
                    dataSource.getMetadata(Habilitation),
                    dataSource.driver,
                )
                table.indices[0].where = ""
                await createTableBefore(dataSource, table)

                await dataSource.synchronize()

                const synchronized = await loadTable(dataSource, "habilitation")
                expect(synchronized.indices).to.have.length(1)
                expect(synchronized.indices[0].name).to.equal(
                    "habilitation_open",
                )
                expect(synchronized.indices[0].where).to.not.equal("")
                await expectNoPendingQueries(dataSource)
            }),
        ))

    it("should recreate a named index when its condition disappears", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const table = Table.create(
                    dataSource.getMetadata(Membership),
                    dataSource.driver,
                )
                table.indices[0].where = `"ends_at" IS NULL`
                await createTableBefore(dataSource, table)

                await dataSource.synchronize()

                const synchronized = await loadTable(dataSource, "membership")
                expect(synchronized.indices).to.have.length(1)
                expect(synchronized.indices[0].name).to.equal(
                    "membership_subject",
                )
                expect(synchronized.indices[0].where).to.equal("")
                await expectNoPendingQueries(dataSource)
            }),
        ))

    it("should keep unchanged indices, partial or not", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                for (const entity of [
                    Habilitation,
                    Membership,
                    Ledger,
                    Waybill,
                ])
                    await createTableBefore(
                        dataSource,
                        Table.create(
                            dataSource.getMetadata(entity),
                            dataSource.driver,
                        ),
                    )

                const habilitation = await loadTable(dataSource, "habilitation")
                expect(habilitation.indices[0].where).to.not.equal("")
                const ledger = await loadTable(dataSource, "ledger")
                expect(ledger.indices[0].where).to.not.equal("")
                const waybill = await loadTable(dataSource, "waybill")
                expect(waybill.indices[0].name).to.equal("waybill WHERE open")
                expect(waybill.indices[0].where).to.equal("")
                await expectNoPendingQueries(dataSource)
            }),
        ))
})

describe("schema builder > index > change > partial index where > hand-made SQLite indices", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Habilitation, Waybill],
            enabledDrivers: ["better-sqlite3", "sqljs"],
            schemaCreate: false,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should plan no query for hand-made indices whose comments contain WHERE", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                for (const entity of [Habilitation, Waybill])
                    await createTableBefore(
                        dataSource,
                        Table.create(
                            dataSource.getMetadata(entity),
                            dataSource.driver,
                        ),
                    )
                await dataSource.query(`DROP INDEX "habilitation_open"`)
                await dataSource.query(
                    `CREATE INDEX "habilitation_open" ON "habilitation" ("subject") /* kept */ WHERE "ends_at" IS NULL`,
                )
                await dataSource.query(`DROP INDEX "waybill WHERE open"`)
                await dataSource.query(
                    `CREATE INDEX "waybill WHERE open" ON "waybill" ("reference") /* ) WHERE "reference" IS NULL`,
                )

                const habilitation = await loadTable(dataSource, "habilitation")
                expect(habilitation.indices[0].where).to.equal(
                    `"ends_at" IS NULL`,
                )
                const waybill = await loadTable(dataSource, "waybill")
                expect(waybill.indices[0].where).to.equal("")
                await expectNoPendingQueries(dataSource)
            }),
        ))
})
