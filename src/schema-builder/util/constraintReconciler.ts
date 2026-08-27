/**
 * Pairs DB-side constraints with metadata-side constraints by structural signature
 * so identical-structure-but-different-name pairs become RENAMEs instead of
 * DROP + CREATE.
 */

export interface ReconcileResult<TDb, TMeta> {
    /**
     * Pairs to emit as renames. `from` is the DB-side item (holds the old name),
     * `to` is the metadata-side item (holds the new name).
     */
    renames: { from: TDb; to: TMeta }[]

    /** DB-side items with no metadata counterpart — the reconciler says drop. */
    drops: TDb[]

    /** Metadata-side items with no DB counterpart — the reconciler says create. */
    creates: TMeta[]

    /**
     * DB signatures that appeared more than once. Caller should log at info level
     * when handling: duplicates get cleaned up as part of reconciliation.
     */
    duplicateDbSignatures: { signature: string; items: TDb[] }[]

    /**
     * Metadata signatures that appeared more than once. Almost always a user
     * error (two structurally identical `@Index` declarations on one entity);
     * caller should surface as a warning.
     */
    duplicateMetadataSignatures: { signature: string; items: TMeta[] }[]
}

export interface ReconcileInput<TDb, TMeta> {
    dbSide: TDb[]
    metaSide: TMeta[]
    signature: {
        db: (item: TDb) => string
        meta: (item: TMeta) => string
    }
    getName: {
        db: (item: TDb) => string | undefined
        meta: (item: TMeta) => string | undefined
    }
}

/**
 * Reconciles DB-side and metadata-side constraint lists. For each structural
 * signature present on both sides:
 *   1. first consumes pairs whose names already match (no-op),
 *   2. then pairs remaining items in name-sorted order, emitting renames,
 *   3. leftover DB items become drops; leftover metadata items become creates.
 *
 * @param input Reconciliation inputs — both sides plus signature and name accessors.
 * @returns Renames, drops, creates, and duplicate-signature diagnostics.
 */
export function reconcileConstraints<TDb, TMeta>(
    input: ReconcileInput<TDb, TMeta>,
): ReconcileResult<TDb, TMeta> {
    const { dbSide, metaSide, signature, getName } = input

    const dbBySignature = groupBy(dbSide, signature.db)
    const metaBySignature = groupBy(metaSide, signature.meta)

    const result: ReconcileResult<TDb, TMeta> = {
        renames: [],
        drops: [],
        creates: [],
        duplicateDbSignatures: [],
        duplicateMetadataSignatures: [],
    }

    const allSignatures = new Set<string>([
        ...dbBySignature.keys(),
        ...metaBySignature.keys(),
    ])

    for (const sig of allSignatures) {
        const dbItems = dbBySignature.get(sig) ?? []
        const metaItems = metaBySignature.get(sig) ?? []

        if (dbItems.length > 1) {
            result.duplicateDbSignatures.push({
                signature: sig,
                items: dbItems.slice(),
            })
        }
        if (metaItems.length > 1) {
            result.duplicateMetadataSignatures.push({
                signature: sig,
                items: metaItems.slice(),
            })
        }

        if (dbItems.length === 0) {
            result.creates.push(...metaItems)
            continue
        }
        if (metaItems.length === 0) {
            result.drops.push(...dbItems)
            continue
        }

        const dbRemaining = dbItems.slice()
        const metaRemaining = metaItems.slice()

        for (let mi = metaRemaining.length - 1; mi >= 0; mi--) {
            const metaName = getName.meta(metaRemaining[mi])
            if (metaName === undefined) continue
            const di = dbRemaining.findIndex(
                (dbItem) => getName.db(dbItem) === metaName,
            )
            if (di !== -1) {
                dbRemaining.splice(di, 1)
                metaRemaining.splice(mi, 1)
            }
        }

        const sortedDb = dbRemaining.slice().sort(byName(getName.db))
        const sortedMeta = metaRemaining.slice().sort(byName(getName.meta))
        const pairCount = Math.min(sortedDb.length, sortedMeta.length)
        for (let i = 0; i < pairCount; i++) {
            result.renames.push({ from: sortedDb[i], to: sortedMeta[i] })
        }
        result.drops.push(...sortedDb.slice(pairCount))
        result.creates.push(...sortedMeta.slice(pairCount))
    }

    return result
}

/**
 * Groups items by a string key into a Map for O(1) signature lookups.
 *
 * @param items Items to group.
 * @param key Function producing the grouping key for each item.
 * @returns A map from key to ordered list of items sharing that key.
 */
function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
    const map = new Map<string, T[]>()
    for (const item of items) {
        const k = key(item)
        const existing = map.get(k)
        if (existing) existing.push(item)
        else map.set(k, [item])
    }
    return map
}

/**
 * Comparator factory that sorts items by their extracted string name.
 * Undefined names sort first (treated as empty string).
 *
 * @param getName Extractor returning the name used for ordering.
 * @returns A comparator suitable for `Array.prototype.sort`.
 */
function byName<T>(
    getName: (item: T) => string | undefined,
): (a: T, b: T) => number {
    return (a, b) => {
        const an = getName(a) ?? ""
        const bn = getName(b) ?? ""
        if (an < bn) return -1
        if (an > bn) return 1
        return 0
    }
}
