import type { CheckMetadata } from "../../metadata/CheckMetadata"
import type { ExclusionMetadata } from "../../metadata/ExclusionMetadata"
import type { IndexMetadata } from "../../metadata/IndexMetadata"
import type { UniqueMetadata } from "../../metadata/UniqueMetadata"
import type { TableCheck } from "../table/TableCheck"
import type { TableExclusion } from "../table/TableExclusion"
import type { TableForeignKey } from "../table/TableForeignKey"
import type { TableIndex } from "../table/TableIndex"
import type { TableUnique } from "../table/TableUnique"

/**
 * Structural fingerprints for table constraints. Two constraints with identical
 * signatures enforce the same rule on the same columns at the DB level and can be
 * paired as a RENAME instead of DROP + CREATE.
 *
 * Signatures deliberately exclude the constraint's name.
 *
 * Column order is preserved as authored for every family. Reordering composite
 * columns in the backing btree index changes query-planner behavior (prefix
 * lookups, ORDER BY elimination) and for MSSQL clustered PKs and MySQL InnoDB
 * determines physical row storage — so reordered columns are a genuine structural
 * difference and must produce a different signature.
 */

/**
 * Structural fingerprint for an index. Ignores name and predicate clauses.
 *
 * @param index Table index whose structure should be summarized.
 * @returns Deterministic string identifying this index's structure.
 */
export function indexSignature(index: TableIndex): string {
    return JSON.stringify([
        "idx",
        index.columnNames,
        !!index.isUnique,
        !!index.isSpatial,
        !!index.isFulltext,
    ])
}

/**
 * Structural fingerprint for a foreign key.
 *
 * Callers must canonicalize `referencedTableName` consistently on both sides (DB
 * catalog read vs metadata-derived) before passing in — dialects populate the
 * schema/database qualifiers differently.
 *
 * @param fk Table foreign key whose structure should be summarized.
 * @returns Deterministic string identifying this FK's structure.
 */
export function foreignKeySignature(fk: TableForeignKey): string {
    return JSON.stringify([
        "fk",
        fk.columnNames,
        fk.referencedTableName,
        fk.referencedColumnNames,
        fk.onDelete ?? "",
        fk.onUpdate ?? "",
    ])
}

/**
 * Structural fingerprint for a composite unique constraint.
 *
 * @param unique Table unique constraint whose structure should be summarized.
 * @returns Deterministic string identifying this unique constraint's structure.
 */
export function uniqueSignature(unique: TableUnique): string {
    return JSON.stringify(["uq", unique.columnNames])
}

/**
 * Structural fingerprint for a primary key — based on the ordered column list.
 *
 * @param columnNames Ordered PK column list.
 * @returns Deterministic string identifying this PK's structure.
 */
export function primaryKeySignature(columnNames: string[]): string {
    return JSON.stringify(["pk", columnNames])
}

/**
 * Structural fingerprint for a check constraint — based on the normalized expression.
 *
 * @param check Table check constraint whose structure should be summarized.
 * @returns Deterministic string identifying this check constraint's structure.
 */
export function checkSignature(check: TableCheck): string {
    return JSON.stringify(["ck", normalizeExpression(check.expression ?? "")])
}

/**
 * Structural fingerprint for an exclusion constraint — based on the normalized expression.
 *
 * @param exclusion Table exclusion constraint whose structure should be summarized.
 * @returns Deterministic string identifying this exclusion constraint's structure.
 */
export function exclusionSignature(exclusion: TableExclusion): string {
    return JSON.stringify([
        "xc",
        normalizeExpression(exclusion.expression ?? ""),
    ])
}

/**
 * Structural fingerprint for an `IndexMetadata`, mirroring {@link indexSignature}
 * but sourced from entity metadata rather than a reflected `TableIndex`.
 *
 * @param index Index metadata whose structure should be summarized.
 * @returns Deterministic string identifying this index's structure.
 */
export function indexMetadataSignature(index: IndexMetadata): string {
    return JSON.stringify([
        "idx",
        index.columns.map((c) => c.databaseName),
        !!index.isUnique,
        !!index.isSpatial,
        !!index.isFulltext,
    ])
}

/**
 * Structural fingerprint for a `UniqueMetadata`.
 *
 * @param unique Unique metadata whose structure should be summarized.
 * @returns Deterministic string identifying this unique's structure.
 */
export function uniqueMetadataSignature(unique: UniqueMetadata): string {
    return JSON.stringify(["uq", unique.columns.map((c) => c.databaseName)])
}

/**
 * Structural fingerprint for a `CheckMetadata` — based on the normalized expression.
 *
 * @param check Check metadata whose structure should be summarized.
 * @returns Deterministic string identifying this check's structure.
 */
export function checkMetadataSignature(check: CheckMetadata): string {
    return JSON.stringify(["ck", normalizeExpression(check.expression ?? "")])
}

/**
 * Structural fingerprint for an `ExclusionMetadata` — based on the normalized expression.
 *
 * @param exclusion Exclusion metadata whose structure should be summarized.
 * @returns Deterministic string identifying this exclusion's structure.
 */
export function exclusionMetadataSignature(
    exclusion: ExclusionMetadata,
): string {
    return JSON.stringify([
        "xc",
        normalizeExpression(exclusion.expression ?? ""),
    ])
}

/**
 * Normalizes a SQL expression string so that trivially equivalent variants produce
 * the same output. Designed for zero false positives — conservative.
 *
 * Steps:
 *   1. trim leading/trailing whitespace
 *   2. collapse whitespace runs to a single space
 *   3. iteratively strip outer parens that wrap the entire expression
 *
 * SQL keyword case is deliberately NOT normalized. Safely lowercasing only
 * outside-of-literal keywords requires a SQL-aware tokenizer that handles
 * single-quoted literals, double-quoted identifiers, backtick identifiers,
 * and bracketed identifiers across dialects. Getting that wrong risks collapsing
 * genuinely distinct expressions (e.g. `col = 'AND'` and `col = 'and'`).
 * Expressions that differ only in keyword case fall through to drop/create —
 * an acceptable false negative.
 *
 * @param expression Raw SQL expression to normalize.
 * @returns Normalized expression string.
 */
export function normalizeExpression(expression: string): string {
    let s = expression.trim().replaceAll(/\s+/g, " ")

    while (s.length >= 2 && s.startsWith("(") && s.endsWith(")")) {
        let depth = 0
        let wrapsWhole = true
        for (let i = 0; i < s.length; i++) {
            if (s[i] === "(") depth++
            else if (s[i] === ")") depth--
            if (depth === 0 && i < s.length - 1) {
                wrapsWhole = false
                break
            }
        }
        if (!wrapsWhole) break
        s = s.slice(1, -1).trim()
    }

    return s
}
