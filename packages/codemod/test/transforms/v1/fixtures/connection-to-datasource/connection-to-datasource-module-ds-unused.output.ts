import type {
    EntitySubscriberInterface,
    InsertEvent,
    DataSource,
} from "typeorm"

declare class UserProfileEntity {}
declare function createDataSource(): DataSource

// Module-scoped `dataSource` exists but is NOT referenced inside the method
// body — the scope-aware rename is safe: the new local simply shadows the
// outer binding within the method, and no existing reference is rebound.
const dataSource = createDataSource()
void dataSource

class UserProfileSubscriber implements EntitySubscriberInterface<UserProfileEntity> {
    async afterInsert(event: InsertEvent<UserProfileEntity>) {
        const { dataSource } = event
        return dataSource
    }
}
