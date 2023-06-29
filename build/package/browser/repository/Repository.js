import { MissingArgumentError } from "../error";
/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias, queryRunner) {
        return this.manager.createQueryBuilder(this.metadata.target, alias || this.metadata.targetName, queryRunner || this.queryRunner);
    }
    /**
     * Returns object that is managed by this repository.
     * If this repository manages entity from schema,
     * then it returns a name of that schema instead.
     */
    get target() {
        return this.metadata.target;
    }
    /**
     * Checks if entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    hasId(entity) {
        if (!entity) {
            throw new MissingArgumentError();
        }
        return this.manager.hasId(this.metadata.target, entity);
    }
    /**
     * Gets entity mixed id.
     */
    getId(entity) {
        if (!entity) {
            throw new MissingArgumentError();
        }
        return this.manager.getId(this.metadata.target, entity);
    }
    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create(plainEntityLikeOrPlainEntityLikes) {
        return this.manager.create(this.metadata.target, plainEntityLikeOrPlainEntityLikes);
    }
    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    merge(mergeIntoEntity, ...entityLikes) {
        if (!mergeIntoEntity) {
            throw new MissingArgumentError();
        }
        return this.manager.merge(this.metadata.target, mergeIntoEntity, ...entityLikes);
    }
    /**
     * Creates a new entity from the given plain javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     *
     * Note that given entity-like object must have an entity id / primary key to find entity by.
     * Returns undefined if entity with given id was not found.
     */
    preload(entityLike) {
        if (!entityLike) {
            throw new MissingArgumentError();
        }
        return this.manager.preload(this.metadata.target, entityLike);
    }
    /**
     * Saves one or many given entities.
     */
    save(entityOrEntities, options) {
        if (!entityOrEntities) {
            throw new MissingArgumentError();
        }
        return this.manager.save(this.metadata.target, entityOrEntities, options);
    }
    /**
     * Removes one or many given entities.
     */
    remove(entityOrEntities, options) {
        if (!entityOrEntities) {
            throw new MissingArgumentError();
        }
        return this.manager.remove(this.metadata.target, entityOrEntities, options);
    }
    /**
     * Records the delete date of one or many given entities.
     */
    softRemove(entityOrEntities, options) {
        if (!entityOrEntities) {
            throw new MissingArgumentError();
        }
        return this.manager.softRemove(this.metadata.target, entityOrEntities, options);
    }
    /**
     * Recovers one or many given entities.
     */
    recover(entityOrEntities, options) {
        if (!entityOrEntities) {
            throw new MissingArgumentError();
        }
        return this.manager.recover(this.metadata.target, entityOrEntities, options);
    }
    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     */
    insert(entity) {
        if (!entity) {
            throw new MissingArgumentError();
        }
        return this.manager.insert(this.metadata.target, entity);
    }
    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    update(criteria, partialEntity) {
        if (!criteria) {
            throw new MissingArgumentError();
        }
        return this.manager.update(this.metadata.target, criteria, partialEntity);
    }
    /**
     * Deletes entities by a given criteria.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    delete(criteria) {
        if (!criteria) {
            throw new MissingArgumentError();
        }
        return this.manager.delete(this.metadata.target, criteria);
    }
    /**
     * Records the delete date of entities by a given criteria.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient SOFT-DELETE query.
     * Does not check if entity exist in the database.
     */
    softDelete(criteria) {
        if (!criteria) {
            throw new MissingArgumentError();
        }
        return this.manager.softDelete(this.metadata.target, criteria);
    }
    /**
     * Restores entities by a given criteria.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient SOFT-DELETE query.
     * Does not check if entity exist in the database.
     */
    restore(criteria) {
        if (!criteria) {
            throw new MissingArgumentError();
        }
        return this.manager.restore(this.metadata.target, criteria);
    }
    /**
     * Counts entities that match given find options or conditions.
     */
    count(optionsOrConditions) {
        return this.manager.count(this.metadata.target, optionsOrConditions);
    }
    /**
     * Finds entities that match given find options or conditions.
     */
    find(optionsOrConditions) {
        if (!optionsOrConditions) {
            throw new MissingArgumentError();
        }
        return this.manager.find(this.metadata.target, optionsOrConditions);
    }
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(optionsOrConditions) {
        if (!optionsOrConditions) {
            throw new MissingArgumentError();
        }
        return this.manager.findAndCount(this.metadata.target, optionsOrConditions);
    }
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    findByIds(ids, optionsOrConditions) {
        if (!ids) {
            throw new MissingArgumentError();
        }
        if (ids.length === 0) {
            return Promise.resolve([]);
        }
        return this.manager.findByIds(this.metadata.target, ids, optionsOrConditions);
    }
    /**
     * Finds first entity that matches given conditions.
     */
    findOne(optionsOrConditions, maybeOptions) {
        if (!optionsOrConditions) {
            throw new MissingArgumentError();
        }
        return this.manager.findOne(this.metadata.target, optionsOrConditions, maybeOptions);
    }
    /**
     * Finds first entity that matches given conditions.
     */
    findOneOrFail(optionsOrConditions, maybeOptions) {
        if (!optionsOrConditions) {
            throw new MissingArgumentError();
        }
        return this.manager.findOneOrFail(this.metadata.target, optionsOrConditions, maybeOptions);
    }
    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    query(query, parameters) {
        return this.manager.query(query, parameters);
    }
    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     *
     * Note: this method uses TRUNCATE and may not work as you expect in transactions on some platforms.
     * @see https://stackoverflow.com/a/5972738/925151
     */
    clear() {
        return this.manager.clear(this.metadata.target);
    }
    /**
     * Increments some column by provided value of the entities matched given conditions.
     */
    increment(conditions, propertyPath, value) {
        if (!conditions) {
            throw new MissingArgumentError();
        }
        return this.manager.increment(this.metadata.target, conditions, propertyPath, value);
    }
    /**
     * Decrements some column by provided value of the entities matched given conditions.
     */
    decrement(conditions, propertyPath, value) {
        if (!conditions) {
            throw new MissingArgumentError();
        }
        return this.manager.decrement(this.metadata.target, conditions, propertyPath, value);
    }
}

//# sourceMappingURL=Repository.js.map
