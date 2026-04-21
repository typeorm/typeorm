import { expect } from "chai"
import { reconcileConstraints } from "../../../src/schema-builder/util/constraintReconciler"
import type { ReconcileInput } from "../../../src/schema-builder/util/constraintReconciler"

interface NamedItem {
    name: string
    sig: string
}

function input(
    dbSide: NamedItem[],
    metaSide: NamedItem[],
): ReconcileInput<NamedItem, NamedItem> {
    return {
        dbSide,
        metaSide,
        signature: {
            db: (item) => item.sig,
            meta: (item) => item.sig,
        },
        getName: {
            db: (item) => item.name,
            meta: (item) => item.name,
        },
    }
}

describe("reconcileConstraints", () => {
    it("returns empty result for empty inputs", () => {
        const result = reconcileConstraints(input([], []))
        expect(result.renames).to.be.empty
        expect(result.drops).to.be.empty
        expect(result.creates).to.be.empty
        expect(result.duplicateDbSignatures).to.be.empty
        expect(result.duplicateMetadataSignatures).to.be.empty
    })

    it("emits no DDL when DB and metadata match exactly by name and signature", () => {
        const item = { name: "IDX_foo", sig: "A" }
        const result = reconcileConstraints(input([item], [item]))
        expect(result.renames).to.be.empty
        expect(result.drops).to.be.empty
        expect(result.creates).to.be.empty
    })

    it("emits a rename when signatures match but names differ", () => {
        const db = { name: "IDX_old", sig: "A" }
        const meta = { name: "IDX_new", sig: "A" }
        const result = reconcileConstraints(input([db], [meta]))
        expect(result.renames).to.deep.equal([{ from: db, to: meta }])
        expect(result.drops).to.be.empty
        expect(result.creates).to.be.empty
    })

    it("emits a drop for DB items with no metadata counterpart", () => {
        const db = { name: "IDX_gone", sig: "A" }
        const result = reconcileConstraints(input([db], []))
        expect(result.drops).to.deep.equal([db])
        expect(result.renames).to.be.empty
        expect(result.creates).to.be.empty
    })

    it("emits a create for metadata items with no DB counterpart", () => {
        const meta = { name: "IDX_new", sig: "A" }
        const result = reconcileConstraints(input([], [meta]))
        expect(result.creates).to.deep.equal([meta])
        expect(result.renames).to.be.empty
        expect(result.drops).to.be.empty
    })

    it("prefers exact name matches over renames when multiple sig-equivalent pairs exist", () => {
        const dbKeep = { name: "IDX_foo", sig: "A" }
        const dbRename = { name: "IDX_obsolete", sig: "A" }
        const metaKeep = { name: "IDX_foo", sig: "A" }
        const metaRename = { name: "IDX_current", sig: "A" }
        const result = reconcileConstraints(
            input([dbKeep, dbRename], [metaKeep, metaRename]),
        )
        expect(result.renames).to.deep.equal([
            { from: dbRename, to: metaRename },
        ])
        expect(result.drops).to.be.empty
        expect(result.creates).to.be.empty
    })

    it("drops extra DB-side duplicates and flags the duplicate signature", () => {
        const dbA = { name: "IDX_a", sig: "A" }
        const dbB = { name: "IDX_b", sig: "A" }
        const meta = { name: "IDX_new", sig: "A" }
        const result = reconcileConstraints(input([dbA, dbB], [meta]))
        expect(result.renames).to.have.lengthOf(1)
        expect(result.drops).to.have.lengthOf(1)
        expect(result.creates).to.be.empty
        expect(result.duplicateDbSignatures).to.have.lengthOf(1)
        expect(result.duplicateDbSignatures[0].items).to.have.members([
            dbA,
            dbB,
        ])
        const renamed = result.renames[0].from
        const dropped = result.drops[0]
        expect([dbA, dbB]).to.include(renamed)
        expect([dbA, dbB]).to.include(dropped)
        expect(renamed).to.not.equal(dropped)
    })

    it("creates extra metadata duplicates and flags the duplicate signature for user warning", () => {
        const db = { name: "IDX_old", sig: "A" }
        const metaA = { name: "IDX_a", sig: "A" }
        const metaB = { name: "IDX_b", sig: "A" }
        const result = reconcileConstraints(input([db], [metaA, metaB]))
        expect(result.renames).to.have.lengthOf(1)
        expect(result.drops).to.be.empty
        expect(result.creates).to.have.lengthOf(1)
        expect(result.duplicateMetadataSignatures).to.have.lengthOf(1)
        expect(result.duplicateMetadataSignatures[0].items).to.have.members([
            metaA,
            metaB,
        ])
    })

    it("handles N:M pairing — pairs what it can, drops+creates the remainder", () => {
        const dbA = { name: "IDX_a", sig: "A" }
        const dbB = { name: "IDX_b", sig: "A" }
        const dbC = { name: "IDX_c", sig: "A" }
        const metaX = { name: "IDX_x", sig: "A" }
        const metaY = { name: "IDX_y", sig: "A" }
        const result = reconcileConstraints(
            input([dbA, dbB, dbC], [metaX, metaY]),
        )
        expect(result.renames).to.have.lengthOf(2)
        expect(result.drops).to.have.lengthOf(1)
        expect(result.creates).to.be.empty
        expect(result.duplicateDbSignatures).to.have.lengthOf(1)
        expect(result.duplicateMetadataSignatures).to.have.lengthOf(1)
    })

    it("does not pair across different signatures", () => {
        const dbA = { name: "IDX_a", sig: "A" }
        const metaB = { name: "IDX_b", sig: "B" }
        const result = reconcileConstraints(input([dbA], [metaB]))
        expect(result.renames).to.be.empty
        expect(result.drops).to.deep.equal([dbA])
        expect(result.creates).to.deep.equal([metaB])
    })

    it("keeps renames deterministic across signatures", () => {
        const db1 = { name: "b", sig: "A" }
        const db2 = { name: "a", sig: "A" }
        const meta1 = { name: "y", sig: "A" }
        const meta2 = { name: "x", sig: "A" }
        const result1 = reconcileConstraints(input([db1, db2], [meta1, meta2]))
        const result2 = reconcileConstraints(input([db2, db1], [meta2, meta1]))
        expect(result1.renames).to.deep.equal(result2.renames)
    })

    it("handles undefined names without crashing", () => {
        const db = { name: undefined as unknown as string, sig: "A" }
        const meta = { name: "IDX_new", sig: "A" }
        const result = reconcileConstraints(input([db], [meta]))
        expect(result.renames).to.deep.equal([{ from: db, to: meta }])
    })

    it("combines drops, creates, and renames across multiple signatures", () => {
        const dbDrop = { name: "IDX_drop", sig: "A" }
        const dbRename = { name: "IDX_rename_old", sig: "B" }
        const metaRename = { name: "IDX_rename_new", sig: "B" }
        const metaCreate = { name: "IDX_new", sig: "C" }

        const result = reconcileConstraints(
            input([dbDrop, dbRename], [metaRename, metaCreate]),
        )

        expect(result.drops).to.deep.equal([dbDrop])
        expect(result.renames).to.deep.equal([
            { from: dbRename, to: metaRename },
        ])
        expect(result.creates).to.deep.equal([metaCreate])
    })
})
