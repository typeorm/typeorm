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

        for (let i = 0; i < v1.length && i < v2.length; i++) {
            if (v1[i] > v2[i]) {
                return true
            } else if (v1[i] < v2[i]) {
                return false
            }
        }

        return true
    }
}

function parseVersion(version: string): number[] {
    return version.split(".").map((value) => parseInt(value, 10))
}
