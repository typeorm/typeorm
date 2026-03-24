import * as v1 from "./v1"

export interface VersionInfo {
    description: string
    migrationGuide: string
}

export const versions: Record<string, VersionInfo> = {
    v1,
}
