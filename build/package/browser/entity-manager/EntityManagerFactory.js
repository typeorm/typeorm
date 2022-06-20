import { EntityManager } from "./EntityManager";
import { MongoEntityManager } from "./MongoEntityManager";
import { SqljsEntityManager } from "./SqljsEntityManager";
/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {
    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    create(connection, queryRunner) {
        if (connection.driver.options.type === "mongodb")
            return new MongoEntityManager(connection);
        if (connection.driver.options.type === "sqljs")
            return new SqljsEntityManager(connection, queryRunner);
        return new EntityManager(connection, queryRunner);
    }
}

//# sourceMappingURL=EntityManagerFactory.js.map
