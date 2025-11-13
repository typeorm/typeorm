import { TableColumn } from "../schema-builder/table/TableColumn"

/**
 * Detects "formal type changes" between two SQL column definitions.
 * These are semantic type conversions — not just length/precision changes.
 *
 * Examples:
 * varchar → int           true
 * int → varchar           true
 * varchar → text          true
 * varchar → nvarchar      true
 * varchar → varbinary     true
 * varchar(50) → varchar(100)  false
 */
export function isFormalTypeChange(
    oldColumn: TableColumn,
    newColumn: TableColumn,
): boolean {
    const norm = (t: unknown): string =>
        (t ?? "")
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s*\(.*\)\s*$/, "")

    const oldType = norm(oldColumn.type)
    const newType = norm(newColumn.type)

    if (oldType === newType) return false

    const strTypes = [
        "varchar",
        "nvarchar",
        "char",
        "nchar",
        "text",
        "ntext",
        "string",
        "clob",
        "json",
        "xml",
        "varchar2",
        "nvarchar2",
        "alphanum",
        "shorttext",
        "longtext",
    ]

    const numTypes = [
        "int",
        "integer",
        "bigint",
        "smallint",
        "tinyint",
        "decimal",
        "numeric",
        "number",
        "float",
        "real",
        "double",
        "binary_double",
        "binary_float",
    ]
    const boolTypes = ["bit", "bool", "boolean"]

    const temporalTypes = [
        "date",
        "datetime",
        "datetime2",
        "datetimeoffset",
        "timestamp",
        "time",
    ]

    const enumTypes = ["enum", "set"]
    const uuidTypes = ["uuid", "uniqueidentifier"]

    const binTypes = [
        "binary",
        "varbinary",
        "blob",
        "bytea",
        "image",
        "longblob",
        "raw",
        "long raw",
    ]

    const textLike = ["text", "ntext", "clob", "json", "xml", "varchar(max)"]

    // helper to test membership
    const inSet = (x: string, arr: string[]) => arr.includes(x)

    // 1. String → Numeric / Boolean
    if (
        inSet(oldType, strTypes) &&
        (inSet(newType, numTypes) || inSet(newType, boolTypes))
    )
        return true

    // 2. Numeric / Boolean → String
    if (
        (inSet(oldType, numTypes) || inSet(oldType, boolTypes)) &&
        inSet(newType, strTypes)
    )
        return true

    // 3. String → Text / Clob / Blob / JSON
    if (inSet(oldType, strTypes) && inSet(newType, textLike)) return true

    // 4. String → Enum / Set / UUID
    if (
        inSet(oldType, strTypes) &&
        (inSet(newType, enumTypes) || inSet(newType, uuidTypes))
    )
        return true

    // 5. String → Temporal
    if (inSet(oldType, strTypes) && inSet(newType, temporalTypes)) return true

    // 6. Cross-string-family (varchar ↔ nvarchar / char / nchar / text)
    if (inSet(oldType, strTypes) && inSet(newType, strTypes)) {
        // consider it a formal change if moving across families
        const family = (t: string): string =>
            t.startsWith("n")
                ? "n"
                : t.includes("text")
                ? "text"
                : t.startsWith("char") || t.endsWith("char")
                ? "char"
                : "vchar"
        if (family(oldType) !== family(newType)) return true
    }

    // 7. Binary / LOB conversions
    if (
        (inSet(oldType, strTypes) && inSet(newType, binTypes)) ||
        (inSet(oldType, binTypes) && inSet(newType, strTypes)) ||
        (inSet(oldType, textLike) && inSet(newType, binTypes)) ||
        (inSet(oldType, binTypes) && inSet(newType, textLike))
    )
        return true

    // otherwise no formal type change
    return false
}

/*
Here are concrete “safe ALTER” examples that this function would return true for.
Grouped by category, showing which type changes are considered safe.

Strings (widening only)
-----------------------
- CHAR → VARCHAR (same or larger length)
- NCHAR → NVARCHAR (same or larger length)
- VARCHAR → VARCHAR (larger length)
- NVARCHAR2 widening (Oracle)
- VARCHAR → TEXT / NTEXT / CLOB (capacity widening to text-like)

Numerics (widening precision/width)
-----------------------------------
- Integer ranks up: TINYINT → SMALLINT → INT → BIGINT
- Decimal/NUMERIC widening (precision and/or scale increase)
- Unparameterized → parameterized (e.g., DECIMAL → DECIMAL(10,2))
- Float/real/double widening:
  FLOAT → DOUBLE
  REAL → DOUBLE
  FLOAT ↔ REAL (treated as equivalent)

Temporals
---------
- Same type with changed parameters (e.g., TIME(3) → TIME(6))
- Widening from DATE → TIMESTAMP or DATETIME/DATETIME2/DATETIMEOFFSET
- Widening within datetime family:
  DATETIME → TIMESTAMP / DATETIME2 / DATETIMEOFFSET
  DATETIME2 → DATETIMEOFFSET
*/

// Keep the same signature / export used in your project
export function isSafeAlter(
    oldColumn: TableColumn,
    newColumn: TableColumn,
): boolean {
    //console.log(oldColumn, newColumn)
    // --- helpers -------------------------------------------------------------
    const norm = (t: unknown): string =>
        (t ?? "").toString().toLowerCase().replace(/\s+/g, " ").trim()

    // Canonicalize engine-specific synonyms to family-friendly base names
    const alias = (t: string): string => {
        const map: Record<string, string> = {
            // Postgres
            "character varying": "varchar",
            character: "char",
            "double precision": "double",
            "timestamp without time zone": "timestamp",
            "timestamp with time zone": "timestamp",
            "time without time zone": "time",
            "time with time zone": "time",
            bytea: "bytea",

            // Oracle
            nvarchar2: "nvarchar2",
            varchar2: "varchar2",
            binary_double: "binary_double",
            binary_float: "binary_float",
            "long raw": "long raw",

            // MySQL-ish
            mediumtext: "text",
            longtext: "longtext",

            // SQL Server
            uniqueidentifier: "uuid",
            image: "image",

            // Short integer synonyms (PG)
            int2: "smallint",
            int4: "int",
            int8: "bigint",
            // Float synonyms
            float4: "real",
            float8: "double",
        }
        return map[t] ?? t
    }

    const base = (t: string) => t.replace(/\s*\(.*\)\s*$/, "")
    const paramsFromType = (t: string) => {
        const m = t.match(/\(([^)]+)\)/)
        return m
            ? m[1]
                  .split(",")
                  .map((s) => parseInt(s.trim(), 10))
                  .filter((n) => !Number.isNaN(n))
            : []
    }
    // Prefer TableColumn.length when params aren’t inline
    const lengthFromCol = (c: TableColumn) => {
        const n = parseInt((c.length ?? "").toString(), 10)
        return Number.isFinite(n) ? n : undefined
    }

    // --- normalize inputs ----------------------------------------------------
    const oldRaw0 = norm(String(oldColumn.type ?? ""))
    const newRaw0 = norm(String(newColumn.type ?? ""))

    const oldRaw = alias(oldRaw0)
    const newRaw = alias(newRaw0)

    const oldType = base(oldRaw)
    const newType = base(newRaw)

    if (oldRaw === newRaw) return true // no effective change

    // --- families ------------------------------------------------------------
    const STR = new Set([
        "varchar",
        "nvarchar",
        "char",
        "nchar",
        "text",
        "ntext",
        "string",
        "clob",
        "json",
        "xml",
        "varchar2",
        "nvarchar2",
        "alphanum",
        "shorttext",
        "longtext",
    ])
    const NUM = new Set([
        "int",
        "integer",
        "bigint",
        "smallint",
        "tinyint",
        "decimal",
        "numeric",
        "number",
        "float",
        "real",
        "double",
        "binary_double",
        "binary_float",
    ])
    const BOOL = new Set(["bit", "bool", "boolean"])
    const TMP = new Set([
        "date",
        "datetime",
        "datetime2",
        "datetimeoffset",
        "timestamp",
        "time",
    ])
    const ENUM = new Set(["enum", "set"])
    const UUID = new Set(["uuid", "uniqueidentifier"])
    const BIN = new Set([
        "binary",
        "varbinary",
        "blob",
        "bytea",
        "image",
        "longblob",
        "raw",
        "long raw",
    ])

    const sameFamily =
        (STR.has(oldType) && STR.has(newType)) ||
        (NUM.has(oldType) && NUM.has(newType)) ||
        (TMP.has(oldType) && TMP.has(newType))

    // reject cross-family or special families we’re not calling “safe”
    if (!sameFamily) return false
    if (BOOL.has(oldType) || BOOL.has(newType)) return false
    if (ENUM.has(oldType) || ENUM.has(newType)) return false
    if (UUID.has(oldType) || UUID.has(newType)) return false
    if (BIN.has(oldType) || BIN.has(newType)) return false

    // --- STRING safe cases ---------------------------------------------------
    if (STR.has(oldType) && STR.has(newType)) {
        const isCharish = (t: string) =>
            t === "char" || t === "nchar" || t.endsWith("char")
        const isVarcharish = (t: string) => t.includes("varchar")
        const textLikes = new Set(["text", "ntext", "clob"])

        const oldP = paramsFromType(oldRaw)
        const newP = paramsFromType(newRaw)
        const oldLen = oldP[0] ?? lengthFromCol(oldColumn)
        const newLen = newP[0] ?? lengthFromCol(newColumn)

        // CHAR(N) -> VARCHAR(M) with M >= N (or unknown lengths: assume widening)
        if (isCharish(oldType) && isVarcharish(newType)) {
            if (oldLen === undefined || newLen === undefined) return true
            return newLen >= oldLen
        }

        // VARCHAR(N) -> VARCHAR(M) with M >= N (or unknown lengths: assume widening)
        if (isVarcharish(oldType) && isVarcharish(newType)) {
            if (oldLen === undefined || newLen === undefined) return true
            return newLen >= oldLen
        }

        // VARCHAR(*) -> TEXT/NTEXT/CLOB (capacity-widening)
        if (isVarcharish(oldType) && textLikes.has(newType)) return true

        return false
    }

    // --- NUMERIC safe cases --------------------------------------------------
    if (NUM.has(oldType) && NUM.has(newType)) {
        // integer widths: tinyint/smallint -> int/integer -> bigint
        const rank: Record<string, number> = {
            tinyint: 1,
            smallint: 2,
            int: 3,
            integer: 3,
            bigint: 4,
        }
        const or = rank[oldType] ?? 0
        const nr = rank[newType] ?? 0
        if (or && nr) return nr >= or // e.g., INT -> BIGINT

        // decimal/numeric widening: increasing precision and/or scale
        const isDec = (t: string) =>
            t === "decimal" || t === "numeric" || t === "number"
        if (isDec(oldType) && isDec(newType)) {
            const [op, os] = (() => {
                const p = paramsFromType(oldRaw)
                return [p[0], p[1]] as const
            })()
            const [np, ns] = (() => {
                const p = paramsFromType(newRaw)
                return [p[0], p[1]] as const
            })()
            if (op === undefined || np === undefined) return true
            if (np > op) return true
            if (np === op && (ns ?? 0) >= (os ?? 0)) return true
            return false
        }

        // float/real/double widening: FLOAT/REAL -> DOUBLE
        const fpr: Record<string, number> = { float: 1, real: 1, double: 2 }
        const of = fpr[oldType] ?? 0
        const nf = fpr[newType] ?? 0
        if (of && nf) return nf >= of

        return false
    }

    // --- TEMPORAL safe cases -------------------------------------------------
    if (TMP.has(oldType) && TMP.has(newType)) {
        if (oldType === newType) return true
        // widening: DATE -> TIMESTAMP/DATETIME*, DATETIME* -> TIMESTAMP/DATETIME*
        if (
            oldType === "date" &&
            (newType === "timestamp" || newType.startsWith("datetime"))
        )
            return true
        if (
            oldType.startsWith("datetime") &&
            (newType === "timestamp" || newType.startsWith("datetime"))
        )
            return true
        return false
    }

    return false
}
