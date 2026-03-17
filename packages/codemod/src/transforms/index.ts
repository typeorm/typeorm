import { description as v1Description } from "./v1"

export interface VersionInfo {
    description: string
}

export const versions: Record<string, VersionInfo> = {
    v1: { description: v1Description },
}
