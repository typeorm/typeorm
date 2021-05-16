import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Repository} from "./Repository";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoRepository} from "./MongoRepository";
import {QueryRunner} from "../query-runner/QueryRunner";
import {EntityManager} from "../entity-manager/EntityManager";

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
    create(manager: EntityManager, metadata: EntityMetadata, queryRunner?: QueryRunner): Repository<any> {

        if (metadata.treeType) {
            // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
            // however we need these properties for internal work of the class
            const repository = new TreeRepository<any>();
            Object.assign(repository, {
                manager: manager,
                metadata: metadata,
                queryRunner: queryRunner,
            });
            return repository;

        } else {
            // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
            // however we need these properties for internal work of the class
            let repository: Repository<any>;
            if (manager.connection.driver instanceof MongoDriver) {
                repository = new MongoRepository();
            } else {
                repository = new Repository<any>();
            }
            Object.assign(repository, {
                manager: manager,
                metadata: metadata,
                queryRunner: queryRunner,
            });

            return repository;
        }
    }

}