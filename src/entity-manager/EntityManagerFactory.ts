import {Connection} from "../connection/Connection";
import {EntityManager} from "./EntityManager";
import {MongoEntityManager} from "./MongoEntityManager";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {SqljsEntityManager} from "./SqljsEntityManager";
import {SqljsDriver} from "../driver/sqljs/SqljsDriver";
import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Helps to create entity managers.
 */
export class EntityManagerFactory {

    /**
     * Creates a new entity manager depend on a given connection's driver.
     */
    create(connection: Connection, queryRunner?: QueryRunner): EntityManager {
        if (connection.driver instanceof MongoDriver)
            return new MongoEntityManager(connection);

        if (connection.driver instanceof SqljsDriver)
            return new SqljsEntityManager(connection, queryRunner);

        return new EntityManager(connection, queryRunner);
    }

}