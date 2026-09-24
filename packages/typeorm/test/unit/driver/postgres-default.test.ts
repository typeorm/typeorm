import { expect } from "chai"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import { TableColumn } from "../../../src/schema-builder/table/TableColumn"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

describe("driver > postgres > defaultEqual", () => {
    // Instantiate driver prototype without live connection side-effects
    const driver = Object.create(PostgresDriver.prototype) as any

    function createColumnMetadata(options: Partial<ColumnMetadata>): ColumnMetadata {
        return {
            default: options.default,
            type: options.type ?? "varchar",
            isArray: options.isArray ?? false,
            ...options,
        } as ColumnMetadata
    }

    function createTableColumn(options: Partial<TableColumn>): TableColumn {
        const column = new TableColumn()
        column.name = options.name ?? "col"
        column.type = options.type ?? "varchar"
        column.default = options.default
        column.isArray = options.isArray ?? false
        return column
    }

    it("should return true when both defaults are null or undefined", () => {
        const meta = createColumnMetadata({ default: undefined })
        const col = createTableColumn({ default: undefined })
        expect(driver["defaultEqual"](meta, col)).to.be.true
    })

    it("should return true for identical string defaults", () => {
        const meta = createColumnMetadata({ default: "active", type: "varchar" })
        const col = createTableColumn({ default: "'active'" })
        expect(driver["defaultEqual"](meta, col)).to.be.true
    })

    it("should match default when entity function includes an explicit enum typecast", () => {
        // Entity: default: () => "'VALUE2'::enum_def"
        // DB (pg_catalog stripped): "'VALUE2'"
        const meta = createColumnMetadata({
            default: () => "'VALUE2'::enum_def",
            type: "enum",
        })
        const col = createTableColumn({ default: "'VALUE2'" })
        expect(driver["defaultEqual"](meta, col)).to.be.true
    })

    it("should match array default when entity specifies array typecast", () => {
        // Entity: default: () => "ARRAY[]::enum_def[]"
        // DB: "ARRAY[]"
        const meta = createColumnMetadata({
            default: () => "ARRAY[]::enum_def[]",
            type: "enum",
            isArray: true,
        })
        const col = createTableColumn({ default: "ARRAY[]", isArray: true })
        expect(driver["defaultEqual"](meta, col)).to.be.true
    })

    it("should treat empty array literals as equivalent for array columns", () => {
        // Entity: default: [] -> normalizes to "'{}'"
        // DB: "ARRAY[]"
        const meta = createColumnMetadata({
            default: [],
            type: "varchar",
            isArray: true,
        })
        const col = createTableColumn({ default: "ARRAY[]", isArray: true })
        expect(driver["defaultEqual"](meta, col)).to.be.true
    })

    it("should return false when defaults are genuinely different", () => {
        const meta = createColumnMetadata({ default: "active", type: "varchar" })
        const col = createTableColumn({ default: "'inactive'" })
        expect(driver["defaultEqual"](meta, col)).to.be.false
    })
})
