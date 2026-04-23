import type {
    DataSource,
    EntityManager,
    EntitySubscriberInterface,
    RemoveEvent,
} from "typeorm"

declare class UserEntity {}

// Chained member access on a tracked receiver: `this.entityManager.connection`
// → `this.entityManager.dataSource`, then `.createQueryBuilder()` runs on the
// DataSource — valid in v1 because `EntityManager.dataSource` is a DataSource.
class ChainedService {
    constructor(
        private readonly dataSource: DataSource,
        private readonly entityManager: EntityManager,
    ) {}

    async build() {
        return this.entityManager.connection.createQueryBuilder()
    }

    async getMetadata() {
        const manager = this.dataSource.manager
        return manager.connection.getMetadata(UserEntity)
    }
}

// Destructuring a tracked event: the destructured `queryRunner` / `manager`
// locals should carry their property type so downstream `.connection` accesses
// on them get rewritten too.
class SubscriberService implements EntitySubscriberInterface<UserEntity> {
    async beforeRemove(event: RemoveEvent<UserEntity>) {
        const { entity, queryRunner } = event
        const schema = queryRunner.connection.options.type
        return { entity, schema }
    }

    async afterInsertLike(event: RemoveEvent<UserEntity>) {
        const { manager } = event
        return manager.connection.getMetadata(UserEntity)
    }
}
