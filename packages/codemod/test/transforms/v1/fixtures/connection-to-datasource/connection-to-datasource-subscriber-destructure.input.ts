import type {
    EntitySubscriberInterface,
    InsertEvent,
    LoadEvent,
    RemoveEvent,
    UpdateEvent,
    RecoverEvent,
} from "typeorm"

declare class UserProfileEntity {}

// Destructure in subscriber handler parameter — `RemoveEvent` has a
// deprecated `.connection` alias in v1, the canonical name is `.dataSource`.
class UserProfileSubscriber implements EntitySubscriberInterface<UserProfileEntity> {
    async beforeRemove(event: RemoveEvent<UserProfileEntity>) {
        const { entity, connection } = event
        return { entity, connection }
    }

    async afterInsert(event: InsertEvent<UserProfileEntity>) {
        // Renamed key with explicit alias — local stays `ds`.
        const { connection: ds } = event
        return ds
    }

    async beforeUpdate(event: UpdateEvent<UserProfileEntity>) {
        // Member access still renamed by the existing pass.
        return event.connection
    }

    async afterLoad(entity: any, event?: LoadEvent<UserProfileEntity>) {
        const { connection } = event!
        return connection
    }

    async afterRecover(event: RecoverEvent<UserProfileEntity>) {
        // A non-typeorm `event` shadow inside would NOT be touched — only
        // the tracked parameter is.
        return event.connection
    }
}

// Control: destructure on a plain object that isn't a tracked type — the
// `connection` key must NOT be renamed.
declare const plain: { connection: string; entity: string }
const { connection: untouched } = plain

// `for...of` / `for...in` destructure — rename still fires when the
// iterated element is a tracked receiver type.
declare const events: RemoveEvent<UserProfileEntity>[]
async function drain() {
    for (const { connection, entity } of events) {
        console.log(connection, entity)
    }
}
