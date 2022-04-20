import { TreeRepository } from "./TreeRepository";
import { Repository } from "./Repository";
import { MongoDriver } from "../driver/mongodb/MongoDriver";
import { MongoRepository } from "./MongoRepository";
/**
 * Factory used to create different types of repositories.
 */
var RepositoryFactory = /** @class */ (function () {
    function RepositoryFactory() {
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a repository.
     */
    RepositoryFactory.prototype.create = function (manager, metadata, queryRunner) {
        if (metadata.treeType) {
            // NOTE: dynamic access to protected properties. We need this to prevent unwanted properties in those classes to be exposed,
            // however we need these properties for internal work of the class
            var repository = new TreeRepository();
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
            var repository = void 0;
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
    };
    return RepositoryFactory;
}());
export { RepositoryFactory };

//# sourceMappingURL=RepositoryFactory.js.map
