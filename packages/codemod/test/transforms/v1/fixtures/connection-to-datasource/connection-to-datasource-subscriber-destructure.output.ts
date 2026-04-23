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
        const { entity, dataSource: connection } = event
        return { entity, connection }
    }

    async afterInsert(event: InsertEvent<UserProfileEntity>) {
        // Renamed key with explicit alias — local stays `ds`.
        const { dataSource: ds } = event
        return ds
    }

    async beforeUpdate(event: UpdateEvent<UserProfileEntity>) {
        // Member access still renamed by the existing pass.
        return event.dataSource
    }

    async afterLoad(entity: any, event?: LoadEvent<UserProfileEntity>) {
        const { dataSource: connection } = event!
        return connection
    }

    async afterRecover(event: RecoverEvent<UserProfileEntity>) {
        // A non-typeorm `event` shadow inside would NOT be touched — only
        // the tracked parameter is.
        return event.dataSource
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
    for (const { dataSource: connection, entity } of events) {
        console.log(connection, entity)
    }
}
