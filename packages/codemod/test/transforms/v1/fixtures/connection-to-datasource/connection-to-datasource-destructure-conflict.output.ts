import type {
    EntitySubscriberInterface,
    InsertEvent,
    DataSource,
} from "typeorm"

declare class UserProfileEntity {}

// Scope-aware binding rename falls back to the re-alias form when a
// `dataSource` binding is already visible in the destructuring's scope —
// renaming the local to `dataSource` would collide with the existing binding.
class UserProfileSubscriber implements EntitySubscriberInterface<UserProfileEntity> {
    async afterInsert(
        event: InsertEvent<UserProfileEntity>,
        dataSource: DataSource,
    ) {
        // `dataSource` is already a parameter binding in this scope — scope
        // rename would shadow it. Must stay as re-alias so `connection` still
        // refers to `event.dataSource` and the outer `dataSource` param is
        // untouched.
        const { dataSource: connection } = event
        return { ds: dataSource, conn: connection }
    }

    async beforeUpdate(event: InsertEvent<UserProfileEntity>) {
        // No `dataSource` in scope — scope-aware rename DOES fire; the inner
        // lambda re-declares `connection` and its references are NOT renamed.
        const { dataSource } = event
        const helper = (connection: string) => connection.length
        return helper(String(dataSource))
    }
}
