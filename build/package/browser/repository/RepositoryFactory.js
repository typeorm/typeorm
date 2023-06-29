import { TreeRepository } from "./TreeRepository";
import { Repository } from "./Repository";
import { MongoDriver } from "../driver/mongodb/MongoDriver";
import { MongoRepository } from "./MongoRepository";
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
    create(manager, metadata, queryRunner) {
        if (metadata.treeType) {
            // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
            // however we need these properties for internal work of the class
            const repository = new TreeRepository();
            Object.assign(repository, {
                manager: manager,
                metadata: metadata,
                queryRunner: queryRunner,
            });
            return repository;
        }
        else {
            // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
            // however we need these properties for internal work of the class
            let repository;
            if (manager.connection.driver instanceof MongoDriver) {
                repository = new MongoRepository();
            }
            else {
                repository = new Repository();
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

//# sourceMappingURL=RepositoryFactory.js.map
