import { EntityMetadata } from "../metadata/EntityMetadata";
import { Repository } from "./Repository";
import { QueryRunner } from "../query-runner/QueryRunner";
import { EntityManager } from "../entity-manager/EntityManager";
/**
 * Factory used to create different types of repositories.
 */
export declare class RepositoryFactory {
    /**
     * Creates a repository.
     */
    create(manager: EntityManager, metadata: EntityMetadata, queryRunner?: QueryRunner): Repository<any>;
}
