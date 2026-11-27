export class VersionUtils {
    static isGreaterOrEqual(
        version: string | undefined,
        targetVersion: string,
    ): boolean {
        if (!version) {
            return false
        }

        const v1 = parseVersion(version)
        const v2 = parseVersion(targetVersion)

        const length = Math.max(v1.length, v2.length)
        for (let i = 0; i < length; i++) {
            const a = v1[i] ?? 0
            const b = v2[i] ?? 0
            if (a > b) {
                return true
            } else if (a < b) {
                return false
            }
        }

        return true
    }
}

/**
 *
 * @param version
 */
function parseVersion(version: string): number[] {
    return version.split(".").map((value) => parseInt(value, 10))
}
