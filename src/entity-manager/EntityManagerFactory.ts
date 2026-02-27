import { DataSource as dataSource } from "../data-source/DataSource"
import { EntityManager } from "./EntityManager"
import { MongoEntityManager } from "./MongoEntityManager"
import { SqljsEntityManager } from "./SqljsEntityManager"
import { QueryRunner } from "../query-runner/QueryRunner"

/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {
    /**
     * Creates a new entity manager depend on a given connection's driver.
     * @param connection
     * @param queryRunner
     */
    create(connection: dataSource, queryRunner?: QueryRunner): EntityManager {
        if (connection.driver.options.type === "mongodb")
            return new MongoEntityManager(connection)

        if (connection.driver.options.type === "sqljs")
            return new SqljsEntityManager(connection, queryRunner)

        return new EntityManager(connection, queryRunner)
    }
}
