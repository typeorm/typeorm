import "reflect-metadata"

import { expect } from "chai"

import type { DataSource } from "../../../../src/data-source/DataSource"
import { In } from "../../../../src/find-options/operator/In"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { OutputValue } from "./entity-mssql-output/OutputValue"

describe("columns > dialect types > MSSQL OUTPUT table", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [OutputValue],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("returns wide Unicode and nullable values from INSERT using physical output types", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const unicode = "漢字かな交じり文-OUTPUT"
                const result = await dataSource
                    .createQueryBuilder()
                    .insert()
                    .into(OutputValue)
                    // SQL expressions isolate the OUTPUT table conversion from
                    // the separate typed-parameter path.
                    .values({
                        wideText: () => `N'${unicode}'`,
                        amount: () => "123.450000",
                        optionalText: null,
                        plainText: "plain text",
                    })
                    .returning([
                        "wideText",
                        "amount",
                        "optionalText",
                        "plainText",
                    ])
                    .execute()

                expect(result.raw).to.have.length(1)
                expect(result.raw[0].wideText).to.equal(unicode)
                expect(result.raw[0].amount).to.equal(123.45)
                expect(result.raw[0].optionalText).to.equal(null)
                expect(result.raw[0].plainText).to.equal("plain text")
            }),
        )
    })

    it("returns expanded precision and scale from UPDATE", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(OutputValue)
                const inserted = await repository.save({
                    wideText: "seed",
                    amount: 1,
                    optionalText: null,
                    plainText: "plain text",
                })

                const result = await repository
                    .createQueryBuilder()
                    .update()
                    .set({ amount: () => "123456789.123456" })
                    .where({ id: inserted.id })
                    .returning(["amount"])
                    .execute()

                expect(result.raw).to.have.length(1)
                expect(result.raw[0].amount).to.be.closeTo(
                    123456789.123456,
                    0.000001,
                )
            }),
        )
    })

    it("uses physical SQL types for INSERT, UPDATE, and find parameters", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(OutputValue)
                const insertedText = "参数插入-漢字かな交じり文"
                const updatedText = "参数更新-한글과漢字OUTPUT"
                const inserted = await repository.save({
                    wideText: insertedText,
                    amount: 123456789.123456,
                    optionalText: null,
                    plainText: "plain text",
                })

                const afterInsert = await dataSource.query(
                    'SELECT "wideText", "amount" FROM "mssql_output_value" WHERE "id" = @0',
                    [inserted.id],
                )
                expect(afterInsert[0].wideText).to.equal(insertedText)
                expect(afterInsert[0].amount).to.be.closeTo(
                    123456789.123456,
                    0.000001,
                )

                await repository.update(inserted.id, {
                    wideText: updatedText,
                    amount: 987654321.654321,
                })
                const afterUpdate = await dataSource.query(
                    'SELECT "wideText", "amount" FROM "mssql_output_value" WHERE "id" = @0',
                    [inserted.id],
                )
                expect(afterUpdate[0].wideText).to.equal(updatedText)
                expect(afterUpdate[0].amount).to.be.closeTo(
                    987654321.654321,
                    0.000001,
                )

                const found = await repository.findOneBy({
                    wideText: updatedText,
                })
                expect(found?.id).to.equal(inserted.id)
                const foundByOperator = await repository.findBy({
                    wideText: In([updatedText]),
                })
                expect(foundByOperator.map((value) => value.id)).to.deep.equal([
                    inserted.id,
                ])
                const metadata = dataSource.getMetadata(OutputValue)
                const wideText =
                    metadata.findColumnWithPropertyName("wideText")!
                const amount = metadata.findColumnWithPropertyName("amount")!
                expect(wideText.type).to.equal("varchar")
                expect(wideText.length).to.equal("10")
                expect(amount.precision).to.equal(8)
                expect(amount.scale).to.equal(2)
            }),
        )
    })

    it("keeps logical metadata stable and has no schema changes after creation", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(OutputValue)
                const wideText =
                    metadata.findColumnWithPropertyName("wideText")!
                const amount = metadata.findColumnWithPropertyName("amount")!
                const optionalText =
                    metadata.findColumnWithPropertyName("optionalText")!
                const plainText =
                    metadata.findColumnWithPropertyName("plainText")!

                expect(wideText.type).to.equal("varchar")
                expect(wideText.length).to.equal("10")
                expect(amount.type).to.equal("decimal")
                expect(amount.precision).to.equal(8)
                expect(amount.scale).to.equal(2)
                expect(optionalText.isNullable).to.equal(true)
                expect(plainText.type).to.equal("varchar")
                expect(plainText.length).to.equal("30")

                const schemaLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(schemaLog.upQueries).to.be.empty
                expect(schemaLog.downQueries).to.be.empty
            }),
        )
    })
})
