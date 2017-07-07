import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoRepository} from "./MongoRepository";
import {QueryRunner} from "../query-runner/QueryRunner";

/**
 * Factory used to create different types of repositories.
 */
export class RepositoryFactory {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a repository.
     */
    create(connection: Connection, metadata: EntityMetadata, queryRunner?: QueryRunner): Repository<any> {

        if (metadata.isClosure) {
            // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
            // however we need these properties for internal work of the class
            const repository = new TreeRepository<any>();
            (repository as any)["manager"] = connection.manager;
            (repository as any)["metadata"] = metadata;
            (repository as any)["queryRunner"] = queryRunner;
            return repository;

        } else {
            // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
            // however we need these properties for internal work of the class
            let repository: Repository<any>;
            if (connection.driver instanceof MongoDriver) {
                repository = new MongoRepository();
            } else {
                repository = new Repository<any>();
            }
            (repository as any)["manager"] = connection.manager;
            (repository as any)["metadata"] = metadata;
            (repository as any)["queryRunner"] = queryRunner;

            return repository;
        }
    }

}