import {Repository} from "./Repository";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SpecificRepository} from "./SpecificRepository";
import {Connection} from "../connection/Connection";
import {TreeRepository} from "./TreeRepository";
import {QueryRunnerProvider} from "../query-runner/QueryRunnerProvider";
import {RepositoryFactory} from "./RepositoryFactory";
import {getFromContainer} from "../container";

/**
 * Aggregates all repositories of the specific metadata.
 */
export class RepositoryAggregator {

    // -------------------------------------------------------------------------
    // Public Readonly properties
    // -------------------------------------------------------------------------

    /**
     * Entity metadata which owns repositories.
     */
    public readonly metadata: EntityMetadata;

    /**
     * Ordinary repository.
     */
    public readonly repository: Repository<any>;

    /**
     * Tree repository.
     */
    public readonly treeRepository?: TreeRepository<any>;

    /**
     * Repository with specific functions.
     */
    public readonly specificRepository: SpecificRepository<any>;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection, metadata: EntityMetadata, queryRunnerProvider?: QueryRunnerProvider) {
        this.metadata = metadata;

        const factory = getFromContainer(RepositoryFactory);

        if (metadata.table.isClosure) {
            this.repository = this.treeRepository = factory.createTreeRepository(connection, metadata, queryRunnerProvider);
        } else {
            this.repository = factory.createRepository(connection, metadata, queryRunnerProvider);
        }

        this.specificRepository = factory.createSpecificRepository(connection, metadata, queryRunnerProvider);
    }

}