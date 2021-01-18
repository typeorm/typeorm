import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Repository} from "./Repository";
import {QueryRunner} from "../query-runner/QueryRunner";
import {EntityManager} from "../entity-manager/EntityManager";
import {Mutable} from "../util/TypeUtils";

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


        let repository: Repository<any>;
        if (manager.connection.driver.createRepository) {
            repository = manager.connection.driver.createRepository();
        } else if (metadata.treeType) {
            repository = new TreeRepository<any>();
        } else {
            repository = new Repository<any>();
        }
        (repository as Mutable<Repository<any>>).manager = manager;
        (repository as Mutable<Repository<any>>).metadata = metadata;
        (repository as Mutable<Repository<any>>).queryRunner = queryRunner;

        return repository;
    }

}
