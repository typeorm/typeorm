import type { DependencyConfig } from "./config"
import { config as v1Config } from "./v1"

export type { DependencyConfig, DependencyReport } from "./config"
export { findPackageJsonFiles } from "./find-package-json"
export { upgradeDependencies } from "./upgrade"

const configs: Record<string, DependencyConfig> = {
    v1: v1Config,
}

export const getConfig = (version: string): DependencyConfig | undefined =>
    configs[version]
