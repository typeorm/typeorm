export interface DependencyConfig {
    /** Packages to replace (old → new package name + version). */
    replacements: Record<string, { replacement: string; version: string }>

    /** Minimum supported versions (package name → semver range). */
    minimumVersions: Record<string, string>

    /** Packages that are incompatible (package name → error message). */
    incompatible: Record<string, string>

    /** Packages that trigger a soft warning (package name → warning message). */
    warnings: Record<string, string>

    /** Minimum required Node.js version. */
    minNodeVersion: string
}

export interface DependencyReport {
    file: string
    changes: string[]
    warnings: string[]
    errors: string[]
}
