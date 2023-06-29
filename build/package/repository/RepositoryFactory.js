"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = void 0;
const TreeRepository_1 = require("./TreeRepository");
const Repository_1 = require("./Repository");
const MongoDriver_1 = require("../driver/mongodb/MongoDriver");
const MongoRepository_1 = require("./MongoRepository");
/**
 * Factory used to create different types of repositories.
 */
class RepositoryFactory {
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
            const repository = new TreeRepository_1.TreeRepository();
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
            if (manager.connection.driver instanceof MongoDriver_1.MongoDriver) {
                repository = new MongoRepository_1.MongoRepository();
            }
            else {
                repository = new Repository_1.Repository();
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
exports.RepositoryFactory = RepositoryFactory;

//# sourceMappingURL=RepositoryFactory.js.map
