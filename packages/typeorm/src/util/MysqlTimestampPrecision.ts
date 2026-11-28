/**
 * Reads fractional precision only from a bare MySQL timestamp function.
 * Other SQL expressions and quoted literals are deliberately not interpreted.
 *
 * @param expression SQL expression to inspect without evaluating or rewriting it.
 * @returns Explicit precision, zero for an omitted precision, or undefined for other expressions.
 */
export function mysqlTimestampPrecision(
    expression?: string,
): number | undefined {
    const match = expression?.match(
        /^\s*(?:CURRENT_TIMESTAMP|NOW)(?:\s*\(\s*(\d*)\s*\))?\s*$/i,
    )
    return match ? Number(match[1] || 0) : undefined
}
