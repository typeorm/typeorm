import "reflect-metadata"
import { expect } from "chai"
import { Table } from "../../../../src/schema-builder/table/Table"
import { TableColumn } from "../../../../src/schema-builder/table/TableColumn"

describe("database schema > partitioning > Table class", () => {
    it("should create Table with partition configuration", () => {
        const table = new Table({
            name: "partitioned_table",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "logdate",
                    type: "date",
                    isPrimary: true,
                }),
            ],
            partition: {
                type: "RANGE",
                columns: ["logdate"],
            },
        })

        expect(table.partition).to.exist
        expect(table.partition?.type).to.equal("RANGE")
        expect(table.partition?.columns).to.deep.equal(["logdate"])
    })

    it("should clone Table with partition configuration", () => {
        const originalTable = new Table({
            name: "original_table",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "region",
                    type: "varchar",
                    isPrimary: true,
                }),
            ],
            partition: {
                type: "LIST",
                columns: ["region"],
                partitions: [
                    { name: "p_us", values: ["US"] },
                    { name: "p_uk", values: ["UK"] },
                ],
            },
        })

        const clonedTable = originalTable.clone()

        expect(clonedTable.partition).to.exist
        expect(clonedTable.partition?.type).to.equal("LIST")
        expect(clonedTable.partition?.columns).to.deep.equal(["region"])
        expect(clonedTable.partition?.partitions).to.have.lengthOf(2)
        expect(clonedTable.partition?.partitions?.[0].name).to.equal("p_us")
    })

    it("should preserve partition with expression in Table", () => {
        const table = new Table({
            name: "expr_table",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "sale_date",
                    type: "date",
                }),
            ],
            partition: {
                type: "RANGE",
                expression: "YEAR(sale_date)",
                partitions: [
                    { name: "p2023", values: ["2024"] },
                    { name: "p2024", values: ["2025"] },
                ],
            },
        })

        expect(table.partition?.expression).to.equal("YEAR(sale_date)")
        expect(table.partition?.columns).to.be.undefined
        expect(table.partition?.partitions).to.have.lengthOf(2)
    })

    it("should handle HASH partition configuration in Table", () => {
        const table = new Table({
            name: "hash_table",
            columns: [
                new TableColumn({
                    name: "user_id",
                    type: "int",
                    isPrimary: true,
                }),
            ],
            partition: {
                type: "HASH",
                columns: ["user_id"],
                partitions: [
                    { name: "p0", values: ["4", "0"] },
                    { name: "p1", values: ["4", "1"] },
                    { name: "p2", values: ["4", "2"] },
                    { name: "p3", values: ["4", "3"] },
                ],
            },
        })

        expect(table.partition?.type).to.equal("HASH")
        expect(table.partition?.partitions).to.have.lengthOf(4)
    })

    it("should handle partition with tablespace option", () => {
        const table = new Table({
            name: "tablespace_table",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "logdate",
                    type: "date",
                    isPrimary: true,
                }),
            ],
            partition: {
                type: "RANGE",
                columns: ["logdate"],
                partitions: [
                    {
                        name: "p2023",
                        values: ["2023-01-01", "2024-01-01"],
                        tablespace: "pg_default",
                    },
                ],
            },
        })

        expect(table.partition?.partitions?.[0].tablespace).to.equal(
            "pg_default",
        )
    })

    it("should clone Table preserving all partition options", () => {
        const table = new Table({
            name: "complex_table",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "date",
                    type: "date",
                    isPrimary: true,
                }),
            ],
            partition: {
                type: "RANGE",
                columns: ["date"],
                partitions: [
                    {
                        name: "p2023",
                        values: ["2023-01-01", "2024-01-01"],
                        tablespace: "ts_2023",
                    },
                    {
                        name: "p2024",
                        values: ["2024-01-01", "2025-01-01"],
                        tablespace: "ts_2024",
                    },
                ],
            },
        })

        const cloned = table.clone()

        expect(cloned.partition).to.deep.equal(table.partition)
        expect(cloned.partition?.partitions?.[0].tablespace).to.equal("ts_2023")
        expect(cloned.partition?.partitions?.[1].tablespace).to.equal("ts_2024")
    })

    it("should handle Table without partition configuration", () => {
        const table = new Table({
            name: "regular_table",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
            ],
        })

        expect(table.partition).to.be.undefined

        const cloned = table.clone()
        expect(cloned.partition).to.be.undefined
    })

    it("should preserve partition configuration through multiple clones", () => {
        const original = new Table({
            name: "original",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "region",
                    type: "varchar",
                    isPrimary: true,
                }),
            ],
            partition: {
                type: "LIST",
                columns: ["region"],
            },
        })

        const clone1 = original.clone()
        const clone2 = clone1.clone()
        const clone3 = clone2.clone()

        expect(clone3.partition).to.exist
        expect(clone3.partition?.type).to.equal("LIST")
        expect(clone3.partition?.columns).to.deep.equal(["region"])
    })

    it("should handle DEFAULT partition in partitions array", () => {
        const table = new Table({
            name: "default_table",
            columns: [
                new TableColumn({
                    name: "id",
                    type: "int",
                    isPrimary: true,
                }),
                new TableColumn({
                    name: "logdate",
                    type: "date",
                    isPrimary: true,
                }),
            ],
            partition: {
                type: "RANGE",
                columns: ["logdate"],
                partitions: [
                    { name: "p2023", values: ["2023-01-01", "2024-01-01"] },
                    { name: "p_default", values: ["DEFAULT"] },
                ],
            },
        })

        expect(table.partition?.partitions).to.have.lengthOf(2)
        expect(table.partition?.partitions?.[1].values).to.deep.equal([
            "DEFAULT",
        ])
    })
})
