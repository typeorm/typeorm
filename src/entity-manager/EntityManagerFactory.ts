import type { DataSource as dataSource } from "../data-source/DataSource"
import { EntityManager } from "./EntityManager"
import { MongoEntityManager } from "./MongoEntityManager"
import { SqljsEntityManager } from "./SqljsEntityManager"
import type { QueryRunner } from "../query-runner/QueryRunner"

/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {
    /**
     * Creates a new entity manager depend on a given connection's driver.
     * @param dataSource
     * @param queryRunner
     * @returns an EntityManager specialized for the driver
     */
    create(dataSource: dataSource, queryRunner?: QueryRunner): EntityManager {
        if (dataSource.driver.options.type === "mongodb")
            return new MongoEntityManager(dataSource)

        if (dataSource.driver.options.type === "sqljs")
            return new SqljsEntityManager(dataSource, queryRunner)

        return new EntityManager(dataSource, queryRunner)
    }
}
