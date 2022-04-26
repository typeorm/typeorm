import { DataSource } from "../data-source/DataSource"
import { EntityManager } from "./EntityManager"
import { MongoEntityManager } from "./MongoEntityManager"
import { SqljsEntityManager } from "./SqljsEntityManager"
import { QueryRunner } from "../query-runner/QueryRunner"
import { DynamoEntityManager } from "./DynamoEntityManager";

/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {
    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    create(connection: DataSource, queryRunner?: QueryRunner): EntityManager {
        if (connection.driver.options.type === "mongodb")
            return new MongoEntityManager(connection)
        if (connection.driver.options.type === "sqljs")
            return new SqljsEntityManager(connection, queryRunner)
        if (connection.driver.options.type === "dynamodb")
            return new DynamoEntityManager(connection);
        return new EntityManager(connection, queryRunner)
    }
}
