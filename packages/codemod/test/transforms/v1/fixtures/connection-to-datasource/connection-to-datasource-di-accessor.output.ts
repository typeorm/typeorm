import type { DataSource, EntityManager, QueryRunner } from "typeorm"

declare class UserEntity {}

// Dependency-injection pattern: the DataSource is held as a class member via
// a TSParameterProperty, and accessor chains are rooted on `this.dataSource`
// rather than a bare local identifier. Both the class-field inference
// (`this.manager = this.dataSource.manager`) and the local-variable case
// (`const qr = this.dataSource.createQueryRunner()`) should flow through to
// the `.connection → .dataSource` member-rename pass.
class UserService {
    // Class field with no explicit type annotation — type inferred from the
    // accessor-chain initializer. Should be tracked as EntityManager.
    private manager = this.dataSource.manager

    constructor(private readonly dataSource: DataSource) {}

    async fromClassField() {
        // `this.manager` was inferred as EntityManager above → `.connection`
        // rewrite should fire.
        return this.manager.dataSource
    }

    async fromLocalAccessor() {
        // `this.dataSource.createQueryRunner()` is a DI-rooted accessor chain
        // → `qr` should be tracked as QueryRunner.
        const qr = this.dataSource.createQueryRunner()
        return qr.dataSource
    }

    async fromLocalMemberAccess() {
        // `this.dataSource.manager` → `mgr` as EntityManager.
        const mgr = this.dataSource.manager
        return mgr.dataSource
    }
}

// Contrast: explicit-type class field already worked in earlier passes — kept
// here as a sanity check that the new walk doesn't double-process it.
class UserServiceExplicit {
    constructor(
        private readonly dataSource: DataSource,
        private readonly manager: EntityManager,
        private readonly queryRunner: QueryRunner,
    ) {}

    async access() {
        return [
            this.manager.dataSource,
            this.queryRunner.dataSource,
            this.dataSource.createQueryBuilder(UserEntity, "u"),
        ]
    }
}
