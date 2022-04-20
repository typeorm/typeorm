"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeRepository = void 0;
var tslib_1 = require("tslib");
var Repository_1 = require("./Repository");
var AbstractSqliteDriver_1 = require("../driver/sqlite-abstract/AbstractSqliteDriver");
/**
 * Repository with additional functions to work with trees.
 *
 * @see Repository
 */
var TreeRepository = /** @class */ (function (_super) {
    tslib_1.__extends(TreeRepository, _super);
    function TreeRepository() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // todo: implement moving
    // todo: implement removing
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Gets complete trees for all roots in the table.
     */
    TreeRepository.prototype.findTrees = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var roots;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findRoots()];
                    case 1:
                        roots = _a.sent();
                        return [4 /*yield*/, Promise.all(roots.map(function (root) { return _this.findDescendantsTree(root); }))];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, roots];
                }
            });
        });
    };
    /**
     * Roots are entities that have no ancestors. Finds them all.
     */
    TreeRepository.prototype.findRoots = function () {
        var _this = this;
        var escapeAlias = function (alias) { return _this.manager.connection.driver.escape(alias); };
        var escapeColumn = function (column) { return _this.manager.connection.driver.escape(column); };
        var parentPropertyName = this.manager.connection.namingStrategy.joinColumnName(this.metadata.treeParentRelation.propertyName, this.metadata.primaryColumns[0].propertyName);
        return this.createQueryBuilder("treeEntity")
            .where(escapeAlias("treeEntity") + "." + escapeColumn(parentPropertyName) + " IS NULL")
            .getMany();
    };
    /**
     * Gets all children (descendants) of the given entity. Returns them all in a flat array.
     */
    TreeRepository.prototype.findDescendants = function (entity) {
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getMany();
    };
    /**
     * Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.
     */
    TreeRepository.prototype.findDescendantsTree = function (entity) {
        var _this = this;
        // todo: throw exception if there is no column of this relation?
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getRawAndEntities()
            .then(function (entitiesAndScalars) {
            var relationMaps = _this.createRelationMaps("treeEntity", entitiesAndScalars.raw);
            _this.buildChildrenEntityTree(entity, entitiesAndScalars.entities, relationMaps);
            return entity;
        });
    };
    /**
     * Gets number of descendants of the entity.
     */
    TreeRepository.prototype.countDescendants = function (entity) {
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getCount();
    };
    /**
     * Creates a query builder used to get descendants of the entities in a tree.
     */
    TreeRepository.prototype.createDescendantsQueryBuilder = function (alias, closureTableAlias, entity) {
        var _this = this;
        // create shortcuts for better readability
        var escape = function (alias) { return _this.manager.connection.driver.escape(alias); };
        if (this.metadata.treeType === "closure-table") {
            var joinCondition = this.metadata.closureJunctionTable.descendantColumns.map(function (column) {
                return escape(closureTableAlias) + "." + escape(column.propertyPath) + " = " + escape(alias) + "." + escape(column.referencedColumn.propertyPath);
            }).join(" AND ");
            var parameters_1 = {};
            var whereCondition = this.metadata.closureJunctionTable.ancestorColumns.map(function (column) {
                parameters_1[column.referencedColumn.propertyName] = column.referencedColumn.getEntityValue(entity);
                return escape(closureTableAlias) + "." + escape(column.propertyPath) + " = :" + column.referencedColumn.propertyName;
            }).join(" AND ");
            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.closureJunctionTable.tableName, closureTableAlias, joinCondition)
                .where(whereCondition)
                .setParameters(parameters_1);
        }
        else if (this.metadata.treeType === "nested-set") {
            var whereCondition = alias + "." + this.metadata.nestedSetLeftColumn.propertyPath + " BETWEEN " +
                "joined." + this.metadata.nestedSetLeftColumn.propertyPath + " AND joined." + this.metadata.nestedSetRightColumn.propertyPath;
            var parameters_2 = {};
            var joinCondition = this.metadata.treeParentRelation.joinColumns.map(function (joinColumn) {
                var parameterName = joinColumn.referencedColumn.propertyPath.replace(".", "_");
                parameters_2[parameterName] = joinColumn.referencedColumn.getEntityValue(entity);
                return "joined." + joinColumn.referencedColumn.propertyPath + " = :" + parameterName;
            }).join(" AND ");
            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.targetName, "joined", whereCondition)
                .where(joinCondition, parameters_2);
        }
        else if (this.metadata.treeType === "materialized-path") {
            return this
                .createQueryBuilder(alias)
                .where(function (qb) {
                var subQuery = qb.subQuery()
                    .select(_this.metadata.targetName + "." + _this.metadata.materializedPathColumn.propertyPath, "path")
                    .from(_this.metadata.target, _this.metadata.targetName)
                    .whereInIds(_this.metadata.getEntityIdMap(entity));
                qb.setNativeParameters(subQuery.expressionMap.nativeParameters);
                if (_this.manager.connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) {
                    return alias + "." + _this.metadata.materializedPathColumn.propertyPath + " LIKE " + subQuery.getQuery() + " || '%'";
                }
                else {
                    return alias + "." + _this.metadata.materializedPathColumn.propertyPath + " LIKE CONCAT(" + subQuery.getQuery() + ", '%')";
                }
            });
        }
        throw new Error("Supported only in tree entities");
    };
    /**
     * Gets all parents (ancestors) of the given entity. Returns them all in a flat array.
     */
    TreeRepository.prototype.findAncestors = function (entity) {
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getMany();
    };
    /**
     * Gets all parents (ancestors) of the given entity. Returns them in a tree - nested into each other.
     */
    TreeRepository.prototype.findAncestorsTree = function (entity) {
        var _this = this;
        // todo: throw exception if there is no column of this relation?
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getRawAndEntities()
            .then(function (entitiesAndScalars) {
            var relationMaps = _this.createRelationMaps("treeEntity", entitiesAndScalars.raw);
            _this.buildParentEntityTree(entity, entitiesAndScalars.entities, relationMaps);
            return entity;
        });
    };
    /**
     * Gets number of ancestors of the entity.
     */
    TreeRepository.prototype.countAncestors = function (entity) {
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getCount();
    };
    /**
     * Creates a query builder used to get ancestors of the entities in the tree.
     */
    TreeRepository.prototype.createAncestorsQueryBuilder = function (alias, closureTableAlias, entity) {
        // create shortcuts for better readability
        // const escape = (alias: string) => this.manager.connection.driver.escape(alias);
        var _this = this;
        if (this.metadata.treeType === "closure-table") {
            var joinCondition = this.metadata.closureJunctionTable.ancestorColumns.map(function (column) {
                return closureTableAlias + "." + column.propertyPath + " = " + alias + "." + column.referencedColumn.propertyPath;
            }).join(" AND ");
            var parameters_3 = {};
            var whereCondition = this.metadata.closureJunctionTable.descendantColumns.map(function (column) {
                parameters_3[column.referencedColumn.propertyName] = column.referencedColumn.getEntityValue(entity);
                return closureTableAlias + "." + column.propertyPath + " = :" + column.referencedColumn.propertyName;
            }).join(" AND ");
            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.closureJunctionTable.tableName, closureTableAlias, joinCondition)
                .where(whereCondition)
                .setParameters(parameters_3);
        }
        else if (this.metadata.treeType === "nested-set") {
            var joinCondition = "joined." + this.metadata.nestedSetLeftColumn.propertyPath + " BETWEEN " +
                alias + "." + this.metadata.nestedSetLeftColumn.propertyPath + " AND " + alias + "." + this.metadata.nestedSetRightColumn.propertyPath;
            var parameters_4 = {};
            var whereCondition = this.metadata.treeParentRelation.joinColumns.map(function (joinColumn) {
                var parameterName = joinColumn.referencedColumn.propertyPath.replace(".", "_");
                parameters_4[parameterName] = joinColumn.referencedColumn.getEntityValue(entity);
                return "joined." + joinColumn.referencedColumn.propertyPath + " = :" + parameterName;
            }).join(" AND ");
            return this
                .createQueryBuilder(alias)
                .innerJoin(this.metadata.targetName, "joined", joinCondition)
                .where(whereCondition, parameters_4);
        }
        else if (this.metadata.treeType === "materialized-path") {
            // example: SELECT * FROM category category WHERE (SELECT mpath FROM `category` WHERE id = 2) LIKE CONCAT(category.mpath, '%');
            return this
                .createQueryBuilder(alias)
                .where(function (qb) {
                var subQuery = qb.subQuery()
                    .select(_this.metadata.targetName + "." + _this.metadata.materializedPathColumn.propertyPath, "path")
                    .from(_this.metadata.target, _this.metadata.targetName)
                    .whereInIds(_this.metadata.getEntityIdMap(entity));
                qb.setNativeParameters(subQuery.expressionMap.nativeParameters);
                if (_this.manager.connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) {
                    return subQuery.getQuery() + " LIKE " + alias + "." + _this.metadata.materializedPathColumn.propertyPath + " || '%'";
                }
                else {
                    return subQuery.getQuery() + " LIKE CONCAT(" + alias + "." + _this.metadata.materializedPathColumn.propertyPath + ", '%')";
                }
            });
        }
        throw new Error("Supported only in tree entities");
    };
    /**
     * Moves entity to the children of then given entity.
     *
    move(entity: Entity, to: Entity): Promise<void> {
        return Promise.resolve();
    } */
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    TreeRepository.prototype.createRelationMaps = function (alias, rawResults) {
        var _this = this;
        return rawResults.map(function (rawResult) {
            var joinColumn = _this.metadata.treeParentRelation.joinColumns[0];
            // fixes issue #2518, default to databaseName property when givenDatabaseName is not set
            var joinColumnName = joinColumn.givenDatabaseName || joinColumn.databaseName;
            var id = rawResult[alias + "_" + _this.metadata.primaryColumns[0].databaseName];
            var parentId = rawResult[alias + "_" + joinColumnName];
            return {
                id: _this.manager.connection.driver.prepareHydratedValue(id, _this.metadata.primaryColumns[0]),
                parentId: _this.manager.connection.driver.prepareHydratedValue(parentId, joinColumn),
            };
        });
    };
    TreeRepository.prototype.buildChildrenEntityTree = function (entity, entities, relationMaps) {
        var _this = this;
        var childProperty = this.metadata.treeChildrenRelation.propertyName;
        var parentEntityId = this.metadata.primaryColumns[0].getEntityValue(entity);
        var childRelationMaps = relationMaps.filter(function (relationMap) { return relationMap.parentId === parentEntityId; });
        var childIds = new Set(childRelationMaps.map(function (relationMap) { return relationMap.id; }));
        entity[childProperty] = entities.filter(function (entity) { return childIds.has(_this.metadata.primaryColumns[0].getEntityValue(entity)); });
        entity[childProperty].forEach(function (childEntity) {
            _this.buildChildrenEntityTree(childEntity, entities, relationMaps);
        });
    };
    TreeRepository.prototype.buildParentEntityTree = function (entity, entities, relationMaps) {
        var _this = this;
        var parentProperty = this.metadata.treeParentRelation.propertyName;
        var entityId = this.metadata.primaryColumns[0].getEntityValue(entity);
        var parentRelationMap = relationMaps.find(function (relationMap) { return relationMap.id === entityId; });
        var parentEntity = entities.find(function (entity) {
            if (!parentRelationMap)
                return false;
            return _this.metadata.primaryColumns[0].getEntityValue(entity) === parentRelationMap.parentId;
        });
        if (parentEntity) {
            entity[parentProperty] = parentEntity;
            this.buildParentEntityTree(entity[parentProperty], entities, relationMaps);
        }
    };
    return TreeRepository;
}(Repository_1.Repository));
exports.TreeRepository = TreeRepository;

//# sourceMappingURL=TreeRepository.js.map
