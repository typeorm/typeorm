"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationIdLoader = void 0;
var tslib_1 = require("tslib");
var DriverUtils_1 = require("../../driver/DriverUtils");
var RelationIdLoader = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationIdLoader(connection, queryRunner, relationIdAttributes) {
        this.connection = connection;
        this.queryRunner = queryRunner;
        this.relationIdAttributes = relationIdAttributes;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    RelationIdLoader.prototype.load = function (rawEntities) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                promises = this.relationIdAttributes.map(function (relationIdAttr) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var duplicates_1, results, relation_1, joinColumns_1, table, tableName, tableAlias_1, duplicates_2, parameters_1, condition, qb_1, results, relation, joinColumns_2, inverseJoinColumns_1, junctionAlias_1, inverseSideTableName, inverseSideTableAlias_1, junctionTableName, mappedColumns, parameters_2, duplicates_3, joinColumnConditions, inverseJoinColumnCondition_1, condition, qb_2, results;
                    var _this = this;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (!(relationIdAttr.relation.isManyToOne || relationIdAttr.relation.isOneToOneOwner)) return [3 /*break*/, 1];
                                // example: Post and Tag
                                // loadRelationIdAndMap("post.tagId", "post.tag")
                                // we expect it to load id of tag
                                if (relationIdAttr.queryBuilderFactory)
                                    throw new Error("Additional condition can not be used with ManyToOne or OneToOne owner relations.");
                                duplicates_1 = [];
                                results = rawEntities.map(function (rawEntity) {
                                    var result = {};
                                    var duplicateParts = [];
                                    relationIdAttr.relation.joinColumns.forEach(function (joinColumn) {
                                        result[joinColumn.databaseName] = _this.connection.driver.prepareHydratedValue(rawEntity[DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, relationIdAttr.parentAlias, joinColumn.databaseName)], joinColumn.referencedColumn);
                                        var duplicatePart = joinColumn.databaseName + ":" + result[joinColumn.databaseName];
                                        if (duplicateParts.indexOf(duplicatePart) === -1) {
                                            duplicateParts.push(duplicatePart);
                                        }
                                    });
                                    relationIdAttr.relation.entityMetadata.primaryColumns.forEach(function (primaryColumn) {
                                        result[primaryColumn.databaseName] = _this.connection.driver.prepareHydratedValue(rawEntity[DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, relationIdAttr.parentAlias, primaryColumn.databaseName)], primaryColumn);
                                        var duplicatePart = primaryColumn.databaseName + ":" + result[primaryColumn.databaseName];
                                        if (duplicateParts.indexOf(duplicatePart) === -1) {
                                            duplicateParts.push(duplicatePart);
                                        }
                                    });
                                    duplicateParts.sort();
                                    var duplicate = duplicateParts.join("::");
                                    if (duplicates_1.indexOf(duplicate) !== -1) {
                                        return null;
                                    }
                                    duplicates_1.push(duplicate);
                                    return result;
                                }).filter(function (v) { return v; });
                                return [2 /*return*/, {
                                        relationIdAttribute: relationIdAttr,
                                        results: results
                                    }];
                            case 1:
                                if (!(relationIdAttr.relation.isOneToMany || relationIdAttr.relation.isOneToOneNotOwner)) return [3 /*break*/, 3];
                                relation_1 = relationIdAttr.relation;
                                joinColumns_1 = relation_1.isOwning ? relation_1.joinColumns : relation_1.inverseRelation.joinColumns;
                                table = relation_1.inverseEntityMetadata.target;
                                tableName = relation_1.inverseEntityMetadata.tableName;
                                tableAlias_1 = relationIdAttr.alias || tableName;
                                duplicates_2 = [];
                                parameters_1 = {};
                                condition = rawEntities.map(function (rawEntity, index) {
                                    var duplicateParts = [];
                                    var parameterParts = {};
                                    var queryPart = joinColumns_1.map(function (joinColumn) {
                                        var parameterName = joinColumn.databaseName + index;
                                        var parameterValue = rawEntity[DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, relationIdAttr.parentAlias, joinColumn.referencedColumn.databaseName)];
                                        var duplicatePart = tableAlias_1 + ":" + joinColumn.propertyPath + ":" + parameterValue;
                                        if (duplicateParts.indexOf(duplicatePart) !== -1) {
                                            return "";
                                        }
                                        duplicateParts.push(duplicatePart);
                                        parameterParts[parameterName] = parameterValue;
                                        return tableAlias_1 + "." + joinColumn.propertyPath + " = :" + parameterName;
                                    }).filter(function (v) { return v; }).join(" AND ");
                                    duplicateParts.sort();
                                    var duplicate = duplicateParts.join("::");
                                    if (duplicates_2.indexOf(duplicate) !== -1) {
                                        return "";
                                    }
                                    duplicates_2.push(duplicate);
                                    Object.assign(parameters_1, parameterParts);
                                    return queryPart;
                                }).filter(function (v) { return v; }).map(function (condition) { return "(" + condition + ")"; })
                                    .join(" OR ");
                                // ensure we won't perform redundant queries for joined data which was not found in selection
                                // example: if post.category was not found in db then no need to execute query for category.imageIds
                                if (!condition)
                                    return [2 /*return*/, { relationIdAttribute: relationIdAttr, results: [] }];
                                qb_1 = this.connection.createQueryBuilder(this.queryRunner);
                                joinColumns_1.forEach(function (joinColumn) {
                                    qb_1.addSelect(tableAlias_1 + "." + joinColumn.propertyPath, joinColumn.databaseName);
                                });
                                relation_1.inverseRelation.entityMetadata.primaryColumns.forEach(function (primaryColumn) {
                                    qb_1.addSelect(tableAlias_1 + "." + primaryColumn.propertyPath, primaryColumn.databaseName);
                                });
                                qb_1.from(table, tableAlias_1)
                                    .where("(" + condition + ")") // need brackets because if we have additional condition and no brackets, it looks like (a = 1) OR (a = 2) AND b = 1, that is incorrect
                                    .setParameters(parameters_1);
                                // apply condition (custom query builder factory)
                                if (relationIdAttr.queryBuilderFactory)
                                    relationIdAttr.queryBuilderFactory(qb_1);
                                return [4 /*yield*/, qb_1.getRawMany()];
                            case 2:
                                results = _a.sent();
                                results.forEach(function (result) {
                                    joinColumns_1.forEach(function (column) {
                                        result[column.databaseName] = _this.connection.driver.prepareHydratedValue(result[column.databaseName], column.referencedColumn);
                                    });
                                    relation_1.inverseRelation.entityMetadata.primaryColumns.forEach(function (column) {
                                        result[column.databaseName] = _this.connection.driver.prepareHydratedValue(result[column.databaseName], column);
                                    });
                                });
                                return [2 /*return*/, {
                                        relationIdAttribute: relationIdAttr,
                                        results: results
                                    }];
                            case 3:
                                relation = relationIdAttr.relation;
                                joinColumns_2 = relation.isOwning ? relation.joinColumns : relation.inverseRelation.inverseJoinColumns;
                                inverseJoinColumns_1 = relation.isOwning ? relation.inverseJoinColumns : relation.inverseRelation.joinColumns;
                                junctionAlias_1 = relationIdAttr.junctionAlias;
                                inverseSideTableName = relationIdAttr.joinInverseSideMetadata.tableName;
                                inverseSideTableAlias_1 = relationIdAttr.alias || inverseSideTableName;
                                junctionTableName = relation.isOwning ? relation.junctionEntityMetadata.tableName : relation.inverseRelation.junctionEntityMetadata.tableName;
                                mappedColumns = rawEntities.map(function (rawEntity) {
                                    return joinColumns_2.reduce(function (map, joinColumn) {
                                        map[joinColumn.propertyPath] = rawEntity[DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, relationIdAttr.parentAlias, joinColumn.referencedColumn.databaseName)];
                                        return map;
                                    }, {});
                                });
                                // ensure we won't perform redundant queries for joined data which was not found in selection
                                // example: if post.category was not found in db then no need to execute query for category.imageIds
                                if (mappedColumns.length === 0)
                                    return [2 /*return*/, { relationIdAttribute: relationIdAttr, results: [] }];
                                parameters_2 = {};
                                duplicates_3 = [];
                                joinColumnConditions = mappedColumns.map(function (mappedColumn, index) {
                                    var duplicateParts = [];
                                    var parameterParts = {};
                                    var queryPart = Object.keys(mappedColumn).map(function (key) {
                                        var parameterName = key + index;
                                        var parameterValue = mappedColumn[key];
                                        var duplicatePart = junctionAlias_1 + ":" + key + ":" + parameterValue;
                                        if (duplicateParts.indexOf(duplicatePart) !== -1) {
                                            return "";
                                        }
                                        duplicateParts.push(duplicatePart);
                                        parameterParts[parameterName] = parameterValue;
                                        return junctionAlias_1 + "." + key + " = :" + parameterName;
                                    }).filter(function (s) { return s; }).join(" AND ");
                                    duplicateParts.sort();
                                    var duplicate = duplicateParts.join("::");
                                    if (duplicates_3.indexOf(duplicate) !== -1) {
                                        return "";
                                    }
                                    duplicates_3.push(duplicate);
                                    Object.assign(parameters_2, parameterParts);
                                    return queryPart;
                                }).filter(function (s) { return s; });
                                inverseJoinColumnCondition_1 = inverseJoinColumns_1.map(function (joinColumn) {
                                    return junctionAlias_1 + "." + joinColumn.propertyPath + " = " + inverseSideTableAlias_1 + "." + joinColumn.referencedColumn.propertyPath;
                                }).join(" AND ");
                                condition = joinColumnConditions.map(function (condition) {
                                    return "(" + condition + " AND " + inverseJoinColumnCondition_1 + ")";
                                }).join(" OR ");
                                qb_2 = this.connection.createQueryBuilder(this.queryRunner);
                                inverseJoinColumns_1.forEach(function (joinColumn) {
                                    qb_2.addSelect(junctionAlias_1 + "." + joinColumn.propertyPath, joinColumn.databaseName)
                                        .addOrderBy(junctionAlias_1 + "." + joinColumn.propertyPath);
                                });
                                joinColumns_2.forEach(function (joinColumn) {
                                    qb_2.addSelect(junctionAlias_1 + "." + joinColumn.propertyPath, joinColumn.databaseName)
                                        .addOrderBy(junctionAlias_1 + "." + joinColumn.propertyPath);
                                });
                                qb_2.from(inverseSideTableName, inverseSideTableAlias_1)
                                    .innerJoin(junctionTableName, junctionAlias_1, condition)
                                    .setParameters(parameters_2);
                                // apply condition (custom query builder factory)
                                if (relationIdAttr.queryBuilderFactory)
                                    relationIdAttr.queryBuilderFactory(qb_2);
                                return [4 /*yield*/, qb_2.getRawMany()];
                            case 4:
                                results = _a.sent();
                                results.forEach(function (result) {
                                    tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(joinColumns_2)), tslib_1.__read(inverseJoinColumns_1)).forEach(function (column) {
                                        result[column.databaseName] = _this.connection.driver.prepareHydratedValue(result[column.databaseName], column.referencedColumn);
                                    });
                                });
                                return [2 /*return*/, {
                                        relationIdAttribute: relationIdAttr,
                                        results: results
                                    }];
                        }
                    });
                }); });
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    };
    return RelationIdLoader;
}());
exports.RelationIdLoader = RelationIdLoader;

//# sourceMappingURL=RelationIdLoader.js.map
