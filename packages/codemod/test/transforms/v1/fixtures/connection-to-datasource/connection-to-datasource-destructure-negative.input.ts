import type {
    EntitySubscriberInterface,
    InsertEvent,
    DataSource,
} from "typeorm"

declare class UserProfileEntity {}
declare function createDataSource(): DataSource

// Module-scoped `dataSource` binding: visible in every function in this file.
// The scope lookup from inside the class method walks up and finds it, so the
// scope-aware rename must fall back to the re-alias form for every
// destructuring in this file.
const dataSource = createDataSource()

declare class Unrelated {
    connection: string
}
declare const unrelated: Unrelated

class UserProfileSubscriber implements EntitySubscriberInterface<UserProfileEntity> {
    async caseModuleConflict(event: InsertEvent<UserProfileEntity>) {
        // Module-scoped `dataSource` is visible here → re-alias fallback.
        const { connection } = event
        return { ds: dataSource, conn: connection }
    }

    async caseNonShorthandKey(event: InsertEvent<UserProfileEntity>) {
        // `{ connection: something }` in an object expression uses `connection`
        // as a property NAME (not a reference to the binding) — the scope-walk
        // must not rename this key. Tested with the module-level `dataSource`
        // conflict active, so the destructure falls back to re-alias.
        const { connection } = event
        const payload: Record<string, unknown> = { connection: "literal-key" }
        return { ds: dataSource, conn: connection, payload }
    }

    async caseUntrackedMemberAccess(event: InsertEvent<UserProfileEntity>) {
        // `unrelated.connection` is member access on a non-typeorm receiver —
        // the prior member-rename pass skips it, and the scope-walk also skips
        // member-access property names.
        const { connection } = event
        return {
            conn: connection,
            otherConn: unrelated.connection,
            ds: dataSource,
        }
    }
}
