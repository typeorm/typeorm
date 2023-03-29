"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationUpdater = void 0;
var tslib_1 = require("tslib");
var SapDriver_1 = require("../driver/sap/SapDriver");
var OracleDriver_1 = require("../driver/oracle/OracleDriver");
/**
 * Allows to work with entity relations and perform specific operations with those relations.
 *
 * todo: add transactions everywhere
 */
var RelationUpdater = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationUpdater(queryBuilder, expressionMap) {
        this.queryBuilder = queryBuilder;
        this.expressionMap = expressionMap;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs set or add operation on a relation.
     */
    RelationUpdater.prototype.update = function (value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var relation, updateSet, updateSet_1, ofs, parameters_1, conditions_1, condition, of_1, updateSet, junctionMetadata_1, ofs, values, firstColumnValues, secondColumnValues_1, bulkInserted_1;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        relation = this.expressionMap.relationMetadata;
                        if (!(relation.isManyToOne || relation.isOneToOneOwner)) return [3 /*break*/, 2];
                        updateSet = relation.joinColumns.reduce(function (updateSet, joinColumn) {
                            var relationValue = value instanceof Object ? joinColumn.referencedColumn.getEntityValue(value) : value;
                            joinColumn.setEntityValue(updateSet, relationValue);
                            return updateSet;
                        }, {});
                        if (!this.expressionMap.of || (Array.isArray(this.expressionMap.of) && !this.expressionMap.of.length))
                            return [2 /*return*/];
                        return [4 /*yield*/, this.queryBuilder
                                .createQueryBuilder()
                                .update(relation.entityMetadata.target)
                                .set(updateSet)
                                .whereInIds(this.expressionMap.of)
                                .execute()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 2:
                        if (!((relation.isOneToOneNotOwner || relation.isOneToMany) && value === null)) return [3 /*break*/, 4];
                        updateSet_1 = {};
                        relation.inverseRelation.joinColumns.forEach(function (column) {
                            updateSet_1[column.propertyName] = null;
                        });
                        ofs = Array.isArray(this.expressionMap.of) ? this.expressionMap.of : [this.expressionMap.of];
                        parameters_1 = {};
                        conditions_1 = [];
                        ofs.forEach(function (of, ofIndex) {
                            relation.inverseRelation.joinColumns.map(function (column, columnIndex) {
                                var parameterName = "joinColumn_" + ofIndex + "_" + columnIndex;
                                parameters_1[parameterName] = of instanceof Object ? column.referencedColumn.getEntityValue(of) : of;
                                conditions_1.push(column.propertyPath + " = :" + parameterName);
                            });
                        });
                        condition = conditions_1.map(function (str) { return "(" + str + ")"; }).join(" OR ");
                        if (!condition)
                            return [2 /*return*/];
                        return [4 /*yield*/, this.queryBuilder
                                .createQueryBuilder()
                                .update(relation.inverseEntityMetadata.target)
                                .set(updateSet_1)
                                .where(condition)
                                .setParameters(parameters_1)
                                .execute()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 4:
                        if (!(relation.isOneToOneNotOwner || relation.isOneToMany)) return [3 /*break*/, 6];
                        if (Array.isArray(this.expressionMap.of))
                            throw new Error("You cannot update relations of multiple entities with the same related object. Provide a single entity into .of method.");
                        of_1 = this.expressionMap.of;
                        updateSet = relation.inverseRelation.joinColumns.reduce(function (updateSet, joinColumn) {
                            var relationValue = of_1 instanceof Object ? joinColumn.referencedColumn.getEntityValue(of_1) : of_1;
                            joinColumn.setEntityValue(updateSet, relationValue);
                            return updateSet;
                        }, {});
                        if (!value || (Array.isArray(value) && !value.length))
                            return [2 /*return*/];
                        return [4 /*yield*/, this.queryBuilder
                                .createQueryBuilder()
                                .update(relation.inverseEntityMetadata.target)
                                .set(updateSet)
                                .whereInIds(value)
                                .execute()];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 6:
                        junctionMetadata_1 = relation.junctionEntityMetadata;
                        ofs = Array.isArray(this.expressionMap.of) ? this.expressionMap.of : [this.expressionMap.of];
                        values = Array.isArray(value) ? value : [value];
                        firstColumnValues = relation.isManyToManyOwner ? ofs : values;
                        secondColumnValues_1 = relation.isManyToManyOwner ? values : ofs;
                        bulkInserted_1 = [];
                        firstColumnValues.forEach(function (firstColumnVal) {
                            secondColumnValues_1.forEach(function (secondColumnVal) {
                                var inserted = {};
                                junctionMetadata_1.ownerColumns.forEach(function (column) {
                                    inserted[column.databaseName] = firstColumnVal instanceof Object ? column.referencedColumn.getEntityValue(firstColumnVal) : firstColumnVal;
                                });
                                junctionMetadata_1.inverseColumns.forEach(function (column) {
                                    inserted[column.databaseName] = secondColumnVal instanceof Object ? column.referencedColumn.getEntityValue(secondColumnVal) : secondColumnVal;
                                });
                                bulkInserted_1.push(inserted);
                            });
                        });
                        if (!bulkInserted_1.length)
                            return [2 /*return*/];
                        if (!(this.queryBuilder.connection.driver instanceof OracleDriver_1.OracleDriver || this.queryBuilder.connection.driver instanceof SapDriver_1.SapDriver)) return [3 /*break*/, 8];
                        return [4 /*yield*/, Promise.all(bulkInserted_1.map(function (value) {
                                return _this.queryBuilder
                                    .createQueryBuilder()
                                    .insert()
                                    .into(junctionMetadata_1.tableName)
                                    .values(value)
                                    .execute();
                            }))];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, this.queryBuilder
                            .createQueryBuilder()
                            .insert()
                            .into(junctionMetadata_1.tableName)
                            .values(bulkInserted_1)
                            .execute()];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return RelationUpdater;
}());
exports.RelationUpdater = RelationUpdater;

//# sourceMappingURL=RelationUpdater.js.map
