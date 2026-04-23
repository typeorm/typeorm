import type {
    EntitySubscriberInterface,
    InsertEvent,
    DataSource,
} from "typeorm"

declare class UserProfileEntity {}

// A nested scope that binds `dataSource` shadows the outer `connection`.
// Scope-aware rename must abort and fall back to the alias form — otherwise
// the nested reference to `connection` would silently retarget to the inner
// `dataSource` parameter after rename.
class UserProfileSubscriber implements EntitySubscriberInterface<UserProfileEntity> {
    async afterInsert(event: InsertEvent<UserProfileEntity>) {
        const { connection } = event
        const helper = (dataSource: DataSource) => {
            // `dataSource` here is helper's own parameter. `connection` is the
            // outer destructured local — renaming it to `dataSource` would
            // resolve to the param instead.
            void dataSource
            return connection
        }
        return helper(null as unknown as DataSource)
    }
}
