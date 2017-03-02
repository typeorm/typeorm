import {TreeRepository} from "./TreeRepository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Connection} from "../connection/Connection";
import {Repository} from "./Repository";
import {SpecificRepository} from "./SpecificRepository";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {MongoRepository} from "./MongoRepository";

/**
 * Factory used to create different types of repositories.
 */
export class RepositoryFactory {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a regular repository.
     */
    createRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): Repository<any> {

        // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
        // however we need these properties for internal work of the class
        let repository: Repository<any>;
        if (connection.driver instanceof MongoDriver) {
            repository = new MongoRepository();
        } else {
            repository = new Repository<any>();
        }
        (repository as any)["connection"] = connection;
        (repository as any)["metadata"] = metadata;
        (repository as any)["queryRunnerProvider"] = queryRunnerProvider;
        return repository;
    }

    /**
     * Creates a tree repository.
     */
    createTreeRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): TreeRepository<any> {

        // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
        // however we need these properties for internal work of the class
        const repository = new TreeRepository<any>();
        (repository as any)["connection"] = connection;
        (repository as any)["metadata"] = metadata;
        (repository as any)["queryRunnerProvider"] = queryRunnerProvider;
        return repository;
    }

    /**
     * Creates a specific repository.
     */
    createSpecificRepository(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider): SpecificRepository<any> {
        return new SpecificRepository(connection, metadata, queryRunnerProvider);
    }

}