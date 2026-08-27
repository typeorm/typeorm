import { expect } from "chai"
import {
    checkSignature,
    exclusionSignature,
    foreignKeySignature,
    indexSignature,
    primaryKeySignature,
    uniqueSignature,
} from "../../../src/schema-builder/util/constraintSignature"
import { TableCheck } from "../../../src/schema-builder/table/TableCheck"
import { TableExclusion } from "../../../src/schema-builder/table/TableExclusion"
import { TableForeignKey } from "../../../src/schema-builder/table/TableForeignKey"
import { TableIndex } from "../../../src/schema-builder/table/TableIndex"
import { TableUnique } from "../../../src/schema-builder/table/TableUnique"

describe("ConstraintSignature", () => {
    describe("indexSignature", () => {
        it("ignores the constraint name", () => {
            const a = new TableIndex({
                name: "IDX_old_hash",
                columnNames: ["email"],
                isUnique: false,
            })
            const b = new TableIndex({
                name: "IDX_new_hash",
                columnNames: ["email"],
                isUnique: false,
            })
            expect(indexSignature(a)).to.equal(indexSignature(b))
        })

        it("treats reordered columns as different indexes", () => {
            const a = new TableIndex({
                columnNames: ["a", "b"],
                isUnique: false,
            })
            const b = new TableIndex({
                columnNames: ["b", "a"],
                isUnique: false,
            })
            expect(indexSignature(a)).to.not.equal(indexSignature(b))
        })

        it("distinguishes isUnique", () => {
            const unique = new TableIndex({
                columnNames: ["email"],
                isUnique: true,
            })
            const nonUnique = new TableIndex({
                columnNames: ["email"],
                isUnique: false,
            })
            expect(indexSignature(unique)).to.not.equal(
                indexSignature(nonUnique),
            )
        })

        it("distinguishes isSpatial", () => {
            const a = new TableIndex({
                columnNames: ["geom"],
                isUnique: false,
                isSpatial: true,
            })
            const b = new TableIndex({
                columnNames: ["geom"],
                isUnique: false,
                isSpatial: false,
            })
            expect(indexSignature(a)).to.not.equal(indexSignature(b))
        })

        it("distinguishes isFulltext", () => {
            const a = new TableIndex({
                columnNames: ["body"],
                isUnique: false,
                isFulltext: true,
            })
            const b = new TableIndex({
                columnNames: ["body"],
                isUnique: false,
                isFulltext: false,
            })
            expect(indexSignature(a)).to.not.equal(indexSignature(b))
        })

        it("ignores `where` — partial predicate differences are real drops/creates", () => {
            const a = new TableIndex({
                columnNames: ["email"],
                isUnique: true,
                where: "deleted_at IS NULL",
            })
            const b = new TableIndex({
                columnNames: ["email"],
                isUnique: true,
                where: "active = true",
            })
            expect(indexSignature(a)).to.equal(indexSignature(b))
        })
    })

    describe("foreignKeySignature", () => {
        it("distinguishes different referenced tables", () => {
            const a = new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
            })
            const b = new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "account",
                referencedColumnNames: ["id"],
            })
            expect(foreignKeySignature(a)).to.not.equal(foreignKeySignature(b))
        })

        it("distinguishes different local columns", () => {
            const a = new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
            })
            const b = new TableForeignKey({
                columnNames: ["account_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
            })
            expect(foreignKeySignature(a)).to.not.equal(foreignKeySignature(b))
        })

        it("treats reordered composite FK columns as different", () => {
            const a = new TableForeignKey({
                columnNames: ["tenant_id", "user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["tenant_id", "id"],
            })
            const b = new TableForeignKey({
                columnNames: ["user_id", "tenant_id"],
                referencedTableName: "user",
                referencedColumnNames: ["tenant_id", "id"],
            })
            expect(foreignKeySignature(a)).to.not.equal(foreignKeySignature(b))
        })

        it("distinguishes onDelete", () => {
            const a = new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            })
            const b = new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            })
            expect(foreignKeySignature(a)).to.not.equal(foreignKeySignature(b))
        })

        it("distinguishes onUpdate", () => {
            const a = new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onUpdate: "CASCADE",
            })
            const b = new TableForeignKey({
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onUpdate: "NO ACTION",
            })
            expect(foreignKeySignature(a)).to.not.equal(foreignKeySignature(b))
        })

        it("ignores the constraint name", () => {
            const a = new TableForeignKey({
                name: "FK_old",
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
            })
            const b = new TableForeignKey({
                name: "FK_new",
                columnNames: ["user_id"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
            })
            expect(foreignKeySignature(a)).to.equal(foreignKeySignature(b))
        })
    })

    describe("uniqueSignature", () => {
        it("treats reordered unique columns as different constraints", () => {
            const a = new TableUnique({ columnNames: ["a", "b"] })
            const b = new TableUnique({ columnNames: ["b", "a"] })
            expect(uniqueSignature(a)).to.not.equal(uniqueSignature(b))
        })

        it("ignores the constraint name", () => {
            const a = new TableUnique({
                name: "UQ_old",
                columnNames: ["email"],
            })
            const b = new TableUnique({
                name: "UQ_new",
                columnNames: ["email"],
            })
            expect(uniqueSignature(a)).to.equal(uniqueSignature(b))
        })
    })

    describe("primaryKeySignature", () => {
        it("treats reordered PK columns as different — composite PK ordering affects clustered index storage", () => {
            expect(primaryKeySignature(["a", "b"])).to.not.equal(
                primaryKeySignature(["b", "a"]),
            )
        })

        it("produces stable output for identical column lists", () => {
            expect(primaryKeySignature(["id"])).to.equal(
                primaryKeySignature(["id"]),
            )
        })
    })

    describe("checkSignature", () => {
        it("matches expressions that differ only in whitespace", () => {
            const a = new TableCheck({ expression: "price > 0" })
            const b = new TableCheck({ expression: "price  >  0" })
            expect(checkSignature(a)).to.equal(checkSignature(b))
        })

        it("matches expressions that differ only in wrapping parens", () => {
            const a = new TableCheck({ expression: "price > 0" })
            const b = new TableCheck({ expression: "(price > 0)" })
            expect(checkSignature(a)).to.equal(checkSignature(b))
        })

        it("distinguishes genuinely different expressions", () => {
            const a = new TableCheck({ expression: "price > 0" })
            const b = new TableCheck({ expression: "price >= 0" })
            expect(checkSignature(a)).to.not.equal(checkSignature(b))
        })

        it("ignores the constraint name", () => {
            const a = new TableCheck({
                name: "CHK_old",
                expression: "price > 0",
            })
            const b = new TableCheck({
                name: "CHK_new",
                expression: "price > 0",
            })
            expect(checkSignature(a)).to.equal(checkSignature(b))
        })
    })

    describe("exclusionSignature", () => {
        it("matches expressions that differ only in formatting", () => {
            const a = new TableExclusion({
                expression: "USING gist (room WITH =, during WITH &&)",
            })
            const b = new TableExclusion({
                expression: "( USING gist (room WITH =, during WITH &&) )",
            })
            expect(exclusionSignature(a)).to.equal(exclusionSignature(b))
        })

        it("distinguishes different expressions", () => {
            const a = new TableExclusion({
                expression: "USING gist (room WITH =, during WITH &&)",
            })
            const b = new TableExclusion({
                expression: "USING gist (room WITH =, during WITH @>)",
            })
            expect(exclusionSignature(a)).to.not.equal(exclusionSignature(b))
        })
    })
})
