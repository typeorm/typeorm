import { transforms as v1, description as v1Description } from "./v1"

export interface VersionInfo {
    description: string
    transforms: typeof v1
}

export const versions: Record<string, VersionInfo> = {
    v1: { description: v1Description, transforms: v1 },
}
