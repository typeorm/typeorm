import type { EntitySubscriberInterface, InsertEvent } from "typeorm"

declare class UserProfileEntity {}

// Computed property keys are value-uses of the local, not property-name
// literals. The scope-aware rename must treat `{ [connection]: x }` as a
// reference site so the local gets renamed end-to-end.
class UserProfileSubscriber implements EntitySubscriberInterface<UserProfileEntity> {
    async afterInsert(event: InsertEvent<UserProfileEntity>) {
        const { dataSource } = event
        return { [dataSource.options.type]: true }
    }
}
