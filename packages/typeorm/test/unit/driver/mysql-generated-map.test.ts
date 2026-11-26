import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import { EntitySchema } from "../../../src/entity-schema/EntitySchema"

class MetadataDataSource extends DataSource {
    buildMetadatas() {
        return super.buildMetadatas()
    }
}

// Regression for https://github.com/typeorm/typeorm/issues/9813.
describe("mysql driver > generated map", () => {
    const bigintSchema = new EntitySchema({
        name: "BigintGeneratedId",
        columns: {
            id: {
                name: "record_id",
                type: "bigint",
                primary: true,
                generated: "increment",
            },
        },
    })
    const numericSchema = new EntitySchema({
        name: "NumericGeneratedId",
        columns: {
            id: { type: "int", primary: true, generated: "increment" },
        },
    })
    const dataSource = new MetadataDataSource({
        type: "mysql",
        database: "test",
        entities: [bigintSchema, numericSchema],
    })

    before(() => dataSource.buildMetadatas())

    const cases: [string | bigint, number, string][] = [
        ["9007199254740993", 0, "9007199254740993"],
        ["9007199254740993", 1, "9007199254740994"],
        ["9007199254740993", 4, "9007199254740997"],
        ["18446744073709551615", 0, "18446744073709551615"],
        ["-9007199254740993", 1, "-9007199254740992"],
        ["100", 1, "101"],
        ["0", 0, "0"],
        [9007199254740993n, 0, "9007199254740993"],
        [9007199254740993n, 1, "9007199254740994"],
    ]

    for (const [insertId, entityIndex, expected] of cases) {
        it(`should preserve ${typeof insertId} insertId ${insertId} at index ${entityIndex}`, () => {
            const result = Object.freeze({ insertId, affectedRows: 5 })
            expect(
                dataSource.driver.createGeneratedMap(
                    dataSource.getMetadata(bigintSchema),
                    result,
                    entityIndex,
                ),
            ).to.deep.equal({ id: expected })
        })
    }

    it("should preserve numeric IDs for int columns", () => {
        expect(
            dataSource.driver.createGeneratedMap(
                dataSource.getMetadata(numericSchema),
                { insertId: 100 },
                1,
            ),
        ).to.deep.equal({ id: 101 })
    })

    it("should preserve string mapping of numeric IDs for bigint columns", () => {
        expect(
            dataSource.driver.createGeneratedMap(
                dataSource.getMetadata(bigintSchema),
                { insertId: 100 },
                1,
            ),
        ).to.deep.equal({ id: "101" })
    })

    it("should preserve the mapping of raw returned column values", () => {
        expect(
            dataSource.driver.createGeneratedMap(
                dataSource.getMetadata(bigintSchema),
                { record_id: "9007199254740993" },
                0,
            ),
        ).to.deep.equal({ id: "9007199254740993" })
    })
})
