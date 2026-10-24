import { expect } from "chai"
import { DataSource } from "../../src/data-source/DataSource"
import type { ColumnOptions } from "../../src/decorator/options/ColumnOptions"
import { MssqlParameter } from "../../src/driver/sqlserver/MssqlParameter"
import type { SqlServerDriver } from "../../src/driver/sqlserver/SqlServerDriver"
import { ColumnMetadata } from "../../src/metadata/ColumnMetadata"
import { EntityMetadata } from "../../src/metadata/EntityMetadata"

describe("SqlServerDriver > output table dialect types", () => {
    // The client stub avoids loading the optional MSSQL dependency. The data
    // source is not initialized, so these real-driver tests never connect.
    const dataSource = new DataSource({ type: "mssql", driver: {} })
    const driver = dataSource.driver as SqlServerDriver
    const entityMetadata = new EntityMetadata({
        dataSource,
        args: { target: "OutputValue", type: "regular" },
    })

    function createColumn(
        propertyName: string,
        options: ColumnOptions,
    ): ColumnMetadata {
        const column = new ColumnMetadata({
            entityMetadata,
            args: {
                target: "OutputValue",
                propertyName,
                mode: "regular",
                options,
            },
        })
        column.databaseName = propertyName
        return column
    }

    it("uses physical SQL Server types for an OUTPUT table without mutating logical metadata", () => {
        const wideText = createColumn("wideText", {
            type: "varchar",
            length: 10,
            dialectTypes: { mssql: "nvarchar(100)" },
        })
        const amount = createColumn("amount", {
            type: "decimal",
            precision: 8,
            scale: 2,
            dialectTypes: { mssql: "decimal(18,6)" },
        })
        const optionalText = createColumn("optionalText", {
            type: "varchar",
            length: 20,
            nullable: true,
            dialectTypes: { mssql: "nvarchar(60)" },
        })
        const plainText = createColumn("plainText", {
            type: "varchar",
            length: 30,
        })
        const computedValue = createColumn("computedValue", {
            type: "int",
            asExpression: "LEN([wideText])",
        })
        entityMetadata.columns = [
            wideText,
            amount,
            optionalText,
            plainText,
            computedValue,
        ]

        expect(
            driver.buildTableVariableDeclaration(
                "@OutputTable",
                entityMetadata.columns,
            ),
        ).to.equal(
            'DECLARE @OutputTable TABLE ("wideText" nvarchar(100), "amount" decimal(18,6), "optionalText" nvarchar(60), "plainText" varchar(30), "computedValue" int)',
        )

        expect(wideText.type).to.equal("varchar")
        expect(wideText.length).to.equal("10")
        expect(amount.type).to.equal("decimal")
        expect(amount.precision).to.equal(8)
        expect(amount.scale).to.equal(2)
        expect(optionalText.isNullable).to.equal(true)
        expect(plainText.resolveDriverColumn(driver)).to.equal(plainText)
        expect(computedValue.asExpression).to.equal("LEN([wideText])")
    })

    it("uses physical SQL Server types for parameters and preserves explicit parameters", () => {
        const wideText = createColumn("wideText", {
            type: "varchar",
            length: 10,
            dialectTypes: { mssql: "nvarchar(100)" },
        })
        const amount = createColumn("amount", {
            type: "decimal",
            precision: 8,
            scale: 2,
            dialectTypes: { mssql: "decimal(18,6)" },
        })

        const textParameter = driver.parametrizeValue(wideText, "漢字OUTPUT")
        expect(textParameter).to.be.instanceOf(MssqlParameter)
        expect(textParameter.type).to.equal("nvarchar")
        expect(textParameter.params).to.deep.equal(["100"])

        const amountParameter = driver.parametrizeValue(
            amount,
            123456789.123456,
        )
        expect(amountParameter.type).to.equal("decimal")
        expect(amountParameter.params).to.deep.equal([18, 6])

        const explicit = new MssqlParameter("already typed", "ntext")
        expect(driver.parametrizeValue(wideText, explicit)).to.equal(explicit)
        expect(wideText.type).to.equal("varchar")
        expect(wideText.length).to.equal("10")
        expect(amount.precision).to.equal(8)
        expect(amount.scale).to.equal(2)
    })
})
