import { Driver } from "../driver/Driver"

export interface IdentifierParseResult {
    baseName: string | null
    isSimple: boolean
}

/**
 * Parse a raw identifier and determine if it is a simple, unqualified name.
 * Supports double-quoted identifiers and unquoted identifiers. Disallows digits at start per SQL standard.
 */
export function parseRawIdentifier(
    raw: string,
    driver: Driver,
): IdentifierParseResult {
    // Check for double-quoted identifier
    const doubleQuoted = raw.match(/^"([A-Za-z_][A-Za-z0-9_]*)"$/)
    if (doubleQuoted) {
        return { baseName: doubleQuoted[1], isSimple: true }
    }

    // Check for unquoted identifier
    const unquotedPattern = /^[A-Za-z_][A-Za-z0-9_]*$/
    if (unquotedPattern.test(raw)) {
        return { baseName: raw, isSimple: true }
    }

    return { baseName: null, isSimple: false }
}
