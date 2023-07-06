"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindOptionsUtils = void 0;
const FindRelationsNotFoundError_1 = require("../error/FindRelationsNotFoundError");
const StringUtils_1 = require("../util/StringUtils");
/**
 * Utilities to work with FindOptions.
 */
class FindOptionsUtils {
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------
    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    static isFindOneOptions(obj) {
        const possibleOptions = obj;
        return possibleOptions &&
            (Array.isArray(possibleOptions.select) ||
                possibleOptions.where instanceof Object ||
                typeof possibleOptions.where === "string" ||
                Array.isArray(possibleOptions.relations) ||
                possibleOptions.join instanceof Object ||
                possibleOptions.order instanceof Object ||
                possibleOptions.cache instanceof Object ||
                typeof possibleOptions.cache === "boolean" ||
                typeof possibleOptions.cache === "number" ||
                possibleOptions.lock instanceof Object ||
                possibleOptions.loadRelationIds instanceof Object ||
                typeof possibleOptions.loadRelationIds === "boolean" ||
                typeof possibleOptions.loadEagerRelations === "boolean" ||
                typeof possibleOptions.withDeleted === "boolean" ||
                typeof possibleOptions.transaction === "boolean");
    }
    /**
     * Checks if given object is really instance of FindManyOptions interface.
     */
    static isFindManyOptions(obj) {
        const possibleOptions = obj;
        return possibleOptions && (this.isFindOneOptions(possibleOptions) ||
            typeof possibleOptions.skip === "number" ||
            typeof possibleOptions.take === "number" ||
            typeof possibleOptions.skip === "string" ||
            typeof possibleOptions.take === "string");
    }
    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindManyOptionsAlias(object) {
        if (this.isFindManyOptions(object) && object.join)
            return object.join.alias;
        return undefined;
    }
    /**
     * Applies give find many options to the given query builder.
     */
    static applyFindManyOptionsOrConditionsToQueryBuilder(qb, options) {
        if (this.isFindManyOptions(options))
            return this.applyOptionsToQueryBuilder(qb, options);
        if (options)
            return qb.where(options);
        return qb;
    }
    /**
     * Applies give find options to the given query builder.
     */
    static applyOptionsToQueryBuilder(qb, options) {
        // if options are not set then simply return query builder. This is made for simplicity of usage.
        if (!options || (!this.isFindOneOptions(options) && !this.isFindManyOptions(options)))
            return qb;
        if (options.transaction === true) {
            qb.expressionMap.useTransaction = true;
        }
        if (!qb.expressionMap.mainAlias || !qb.expressionMap.mainAlias.hasMetadata)
            return qb;
        const metadata = qb.expressionMap.mainAlias.metadata;
        // apply all options from FindOptions
        if (options.select) {
            qb.select([]);
            options.select.forEach(select => {
                if (!metadata.findColumnWithPropertyPath(String(select)))
                    throw new Error(`${String(select)} column was not found in the ${metadata.name} entity.`);
                qb.addSelect(qb.alias + "." + String(select));
            });
        }
        if (options.where)
            qb.where(options.where);
        if (options.skip)
            qb.skip(options.skip);
        if (options.take)
            qb.take(options.take);
        if (options.order)
            Object.keys(options.order).forEach(key => {
                const order = options.order[key];
                if (!metadata.findColumnWithPropertyPath(key))
                    throw new Error(`${key} column was not found in the ${metadata.name} entity.`);
                switch (order) {
                    case 1:
                        qb.addOrderBy(qb.alias + "." + key, "ASC");
                        break;
                    case -1:
                        qb.addOrderBy(qb.alias + "." + key, "DESC");
                        break;
                    case "ASC":
                        qb.addOrderBy(qb.alias + "." + key, "ASC");
                        break;
                    case "DESC":
                        qb.addOrderBy(qb.alias + "." + key, "DESC");
                        break;
                }
            });
        if (options.relations) {
            const allRelations = options.relations.map(relation => relation);
            this.applyRelationsRecursively(qb, allRelations, qb.expressionMap.mainAlias.name, qb.expressionMap.mainAlias.metadata, "");
            // recursive removes found relations from allRelations array
            // if there are relations left in this array it means those relations were not found in the entity structure
            // so, we give an exception about not found relations
            if (allRelations.length > 0)
                throw new FindRelationsNotFoundError_1.FindRelationsNotFoundError(allRelations);
        }
        if (options.join) {
            if (options.join.leftJoin)
                Object.keys(options.join.leftJoin).forEach(key => {
                    qb.leftJoin(options.join.leftJoin[key], key);
                });
            if (options.join.innerJoin)
                Object.keys(options.join.innerJoin).forEach(key => {
                    qb.innerJoin(options.join.innerJoin[key], key);
                });
            if (options.join.leftJoinAndSelect)
                Object.keys(options.join.leftJoinAndSelect).forEach(key => {
                    qb.leftJoinAndSelect(options.join.leftJoinAndSelect[key], key);
                });
            if (options.join.innerJoinAndSelect)
                Object.keys(options.join.innerJoinAndSelect).forEach(key => {
                    qb.innerJoinAndSelect(options.join.innerJoinAndSelect[key], key);
                });
        }
        if (options.cache) {
            if (options.cache instanceof Object) {
                const cache = options.cache;
                qb.cache(cache.id, cache.milliseconds);
            }
            else {
                qb.cache(options.cache);
            }
        }
        if (options.lock) {
            if (options.lock.mode === "optimistic") {
                qb.setLock(options.lock.mode, options.lock.version);
            }
            else if (options.lock.mode === "pessimistic_read" || options.lock.mode === "pessimistic_write" || options.lock.mode === "dirty_read" || options.lock.mode === "pessimistic_partial_write" || options.lock.mode === "pessimistic_write_or_fail") {
                const tableNames = options.lock.tables ? options.lock.tables.map((table) => {
                    const tableAlias = qb.expressionMap.aliases.find((alias) => {
                        return alias.metadata.tableNameWithoutPrefix === table;
                    });
                    if (!tableAlias) {
                        throw new Error(`"${table}" is not part of this query`);
                    }
                    return qb.escape(tableAlias.name);
                }) : undefined;
                qb.setLock(options.lock.mode, undefined, tableNames);
            }
        }
        if (options.withDeleted) {
            qb.withDeleted();
        }
        if (options.loadRelationIds === true) {
            qb.loadAllRelationIds();
        }
        else if (options.loadRelationIds instanceof Object) {
            qb.loadAllRelationIds(options.loadRelationIds);
        }
        return qb;
    }
    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------
    /**
     * Adds joins for all relations and sub-relations of the given relations provided in the find options.
     */
    static applyRelationsRecursively(qb, allRelations, alias, metadata, prefix) {
        // find all relations that match given prefix
        let matchedBaseRelations = [];
        if (prefix) {
            const regexp = new RegExp("^" + prefix.replace(".", "\\.") + "\\.");
            matchedBaseRelations = allRelations
                .filter(relation => relation.match(regexp))
                .map(relation => relation.replace(regexp, ""))
                .filter(relation => metadata.findRelationWithPropertyPath(relation));
        }
        else {
            matchedBaseRelations = allRelations.filter(relation => metadata.findRelationWithPropertyPath(relation));
        }
        // go through all matched relations and add join for them
        matchedBaseRelations.forEach(relation => {
            // generate a relation alias
            let relationAlias = alias + "__" + relation;
            // shorten it if needed by the driver
            if (qb.connection.driver.maxAliasLength && relationAlias.length > qb.connection.driver.maxAliasLength) {
                relationAlias = (0, StringUtils_1.shorten)(relationAlias);
            }
            // add a join for the found relation
            const selection = alias + "." + relation;
            qb.leftJoinAndSelect(selection, relationAlias);
            // join the eager relations of the found relation
            const relMetadata = metadata.relations.find(metadata => metadata.propertyName === relation);
            if (relMetadata) {
                this.joinEagerRelations(qb, relationAlias, relMetadata.inverseEntityMetadata);
            }
            // remove added relations from the allRelations array, this is needed to find all not found relations at the end
            allRelations.splice(allRelations.indexOf(prefix ? prefix + "." + relation : relation), 1);
            // try to find sub-relations
            const join = qb.expressionMap.joinAttributes.find(join => join.entityOrProperty === selection);
            this.applyRelationsRecursively(qb, allRelations, join.alias.name, join.metadata, prefix ? prefix + "." + relation : relation);
        });
    }
    static joinEagerRelations(qb, alias, metadata) {
        metadata.eagerRelations.forEach(relation => {
            const relationAlias = qb.connection.namingStrategy.eagerJoinRelationAlias(alias, relation.propertyPath);
            qb.leftJoinAndSelect(alias + "." + relation.propertyPath, relationAlias);
            this.joinEagerRelations(qb, relationAlias, relation.inverseEntityMetadata);
        });
    }
}
exports.FindOptionsUtils = FindOptionsUtils;
//# sourceMappingURL=FindOptionsUtils.js.map