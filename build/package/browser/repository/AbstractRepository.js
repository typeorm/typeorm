import { CustomRepositoryDoesNotHaveEntityError } from "../error/CustomRepositoryDoesNotHaveEntityError";
import { getMetadataArgsStorage } from "../index";
import { CustomRepositoryNotFoundError } from "../error/CustomRepositoryNotFoundError";
/**
 * Provides abstract class for custom repositories that do not inherit from original orm Repository.
 * Contains all most-necessary methods to simplify code in the custom repository.
 * All methods are protected thus not exposed and it allows to create encapsulated custom repository.
 *
 * @experimental
 */
var AbstractRepository = /** @class */ (function () {
    function AbstractRepository() {
    }
    Object.defineProperty(AbstractRepository.prototype, "repository", {
        // -------------------------------------------------------------------------
        // Protected Accessors
        // -------------------------------------------------------------------------
        /**
         * Gets the original ORM repository for the entity that is managed by this repository.
         * If current repository does not manage any entity, then exception will be thrown.
         */
        get: function () {
            var target = this.getCustomRepositoryTarget(this);
            if (!target)
                throw new CustomRepositoryDoesNotHaveEntityError(this.constructor);
            return this.manager.getRepository(target);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(AbstractRepository.prototype, "treeRepository", {
        /**
         * Gets the original ORM tree repository for the entity that is managed by this repository.
         * If current repository does not manage any entity, then exception will be thrown.
         */
        get: function () {
            var target = this.getCustomRepositoryTarget(this);
            if (!target)
                throw new CustomRepositoryDoesNotHaveEntityError(this.constructor);
            return this.manager.getTreeRepository(target);
        },
        enumerable: false,
        configurable: true
    });
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new query builder for the repository's entity that can be used to build a sql query.
     * If current repository does not manage any entity, then exception will be thrown.
     */
    AbstractRepository.prototype.createQueryBuilder = function (alias) {
        var target = this.getCustomRepositoryTarget(this.constructor);
        if (!target)
            throw new CustomRepositoryDoesNotHaveEntityError(this.constructor);
        return this.manager.getRepository(target).createQueryBuilder(alias);
    };
    /**
     * Creates a new query builder for the given entity that can be used to build a sql query.
     */
    AbstractRepository.prototype.createQueryBuilderFor = function (entity, alias) {
        return this.getRepositoryFor(entity).createQueryBuilder(alias);
    };
    /**
     * Gets the original ORM repository for the given entity class.
     */
    AbstractRepository.prototype.getRepositoryFor = function (entity) {
        return this.manager.getRepository(entity);
    };
    /**
     * Gets the original ORM tree repository for the given entity class.
     */
    AbstractRepository.prototype.getTreeRepositoryFor = function (entity) {
        return this.manager.getTreeRepository(entity);
    };
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    /**
     * Gets custom repository's managed entity.
     * If given custom repository does not manage any entity then undefined will be returned.
     */
    AbstractRepository.prototype.getCustomRepositoryTarget = function (customRepository) {
        var entityRepositoryMetadataArgs = getMetadataArgsStorage().entityRepositories.find(function (repository) {
            return repository.target === (customRepository instanceof Function ? customRepository : customRepository.constructor);
        });
        if (!entityRepositoryMetadataArgs)
            throw new CustomRepositoryNotFoundError(customRepository);
        return entityRepositoryMetadataArgs.entity;
    };
    return AbstractRepository;
}());
export { AbstractRepository };

//# sourceMappingURL=AbstractRepository.js.map
