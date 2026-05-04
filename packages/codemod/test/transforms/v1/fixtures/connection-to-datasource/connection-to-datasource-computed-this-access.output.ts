import type { DataSource } from "typeorm"

declare const dataSource: string

// Computed receiver — `this[dataSource]` must NOT be treated as the tracked
// `this.dataSource` even though `property.name === "dataSource"` would match
// for the literal access. The bracketed identifier is a runtime variable
// lookup, not the literal property name.
class Service {
    constructor(private dataSource: DataSource) {}

    async run() {
        // Same TS shape as `this.dataSource.manager.connection`, but the
        // computed bracket means we cannot statically prove the receiver
        // resolves to the DataSource member — leave `.connection` untouched.
        const mgr = (this as unknown as Record<string, DataSource>)[dataSource]
            .manager
        return mgr.connection
    }
}
