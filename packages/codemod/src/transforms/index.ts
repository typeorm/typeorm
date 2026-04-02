import * as v1 from "./v1"
import type { TransformModule } from "./transformer"

export interface VersionInfo {
    description: string
    upgradingGuide: string
    transforms: TransformModule[]
}

export const versions: Record<string, VersionInfo> = {
    v1,
}
