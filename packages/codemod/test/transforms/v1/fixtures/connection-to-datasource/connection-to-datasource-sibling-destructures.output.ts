import type {
    EntitySubscriberInterface,
    InsertEvent,
    RemoveEvent,
} from "typeorm"

declare class UserProfileEntity {}

// Two `{ connection }` shorthand destructures from tracked receivers in the
// same scope. After the first rename succeeds and introduces a `dataSource`
// binding, the second must detect the now-existing `dataSource` and fall
// back to the alias form — otherwise both bindings would collide.
class UserProfileSubscriber implements EntitySubscriberInterface<UserProfileEntity> {
    async afterInsert(
        insertEvent: InsertEvent<UserProfileEntity>,
        removeEvent: RemoveEvent<UserProfileEntity>,
    ) {
        const { dataSource } = insertEvent
        const { dataSource: connection2 } = removeEvent
        return [dataSource, connection2]
    }
}
