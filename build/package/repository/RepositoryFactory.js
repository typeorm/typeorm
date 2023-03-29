"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryFactory = void 0;
var TreeRepository_1 = require("./TreeRepository");
var Repository_1 = require("./Repository");
var MongoDriver_1 = require("../driver/mongodb/MongoDriver");
var MongoRepository_1 = require("./MongoRepository");
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
            var repository = new TreeRepository_1.TreeRepository();
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
    };
    return RepositoryFactory;
}());
exports.RepositoryFactory = RepositoryFactory;

//# sourceMappingURL=RepositoryFactory.js.map
