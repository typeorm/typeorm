import type { DataSource, EntityManager } from "typeorm"

// Class-property pattern — `this.tenantConnection` is typed as `DataSource`
// via a constructor parameter property, so `.connect()` / `.close()` /
// `.isConnected` on `this.tenantConnection` should be rewritten.
class TenantConnectionService {
    constructor(
        private readonly tenantConnection: DataSource,
        private readonly managerRef: EntityManager,
    ) {}

    // Class getter with typeorm return type — `this.entityManager` should
    // resolve to `EntityManager`, so `this.entityManager.connection` rewrites
    // to `.dataSource`.
    private get entityManager(): EntityManager {
        return this.tenantConnection.manager
    }

    async open() {
        await this.tenantConnection.connect()
        if (this.tenantConnection.isConnected) return
        await this.tenantConnection.close()
    }

    useManager() {
        // `this.managerRef` is EntityManager → `.connection` → `.dataSource`
        return this.managerRef.connection
    }

    useGetter() {
        // `this.entityManager` resolves via the getter's return type.
        return this.entityManager.connection.createQueryBuilder()
    }
}

// Control: an untyped class property must NOT be treated as a TypeORM
// receiver — `this.other.connection` stays as-is.
class Unrelated {
    constructor(private readonly other: { connection: { x: number } }) {}
    read() {
        return this.other.connection.x
    }
}
