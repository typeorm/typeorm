"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
/**
 * Allows to work with entity relations and perform specific operations with those relations.
 *
 * todo: add transactions everywhere
 */
var RelationRemover = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationRemover(queryBuilder, expressionMap) {
        this.queryBuilder = queryBuilder;
        this.expressionMap = expressionMap;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Performs remove operation on a relation.
     */
    RelationRemover.prototype.remove = function (value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var relation, ofs, values_1, updateSet_1, parameters_1, conditions_1, condition, junctionMetadata_1, ofs, values, firstColumnValues, secondColumnValues_1, parameters_2, conditions_2, condition;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        relation = this.expressionMap.relationMetadata;
                        if (!relation.isOneToMany) return [3 /*break*/, 2];
                        ofs = this.expressionMap.of instanceof Array ? this.expressionMap.of : [this.expressionMap.of];
                        values_1 = value instanceof Array ? value : [value];
                        updateSet_1 = {};
                        relation.inverseRelation.joinColumns.forEach(function (column) {
                            updateSet_1[column.propertyName] = null;
                        });
                        parameters_1 = {};
                        conditions_1 = [];
                        ofs.forEach(function (of, ofIndex) {
                            conditions_1.push.apply(conditions_1, tslib_1.__spread(values_1.map(function (value, valueIndex) {
                                return tslib_1.__spread(relation.inverseRelation.joinColumns.map(function (column, columnIndex) {
                                    var parameterName = "joinColumn_" + ofIndex + "_" + valueIndex + "_" + columnIndex;
                                    parameters_1[parameterName] = of instanceof Object ? column.referencedColumn.getEntityValue(of) : of;
                                    return column.propertyPath + " = :" + parameterName;
                                }), relation.inverseRelation.entityMetadata.primaryColumns.map(function (column, columnIndex) {
                                    var parameterName = "primaryColumn_" + valueIndex + "_" + valueIndex + "_" + columnIndex;
                                    parameters_1[parameterName] = value instanceof Object ? column.getEntityValue(value) : value;
                                    return column.propertyPath + " = :" + parameterName;
                                })).join(" AND ");
                            })));
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
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        junctionMetadata_1 = relation.junctionEntityMetadata;
                        ofs = this.expressionMap.of instanceof Array ? this.expressionMap.of : [this.expressionMap.of];
                        values = value instanceof Array ? value : [value];
                        firstColumnValues = relation.isManyToManyOwner ? ofs : values;
                        secondColumnValues_1 = relation.isManyToManyOwner ? values : ofs;
                        parameters_2 = {};
                        conditions_2 = [];
                        firstColumnValues.forEach(function (firstColumnVal, firstColumnValIndex) {
                            conditions_2.push.apply(conditions_2, tslib_1.__spread(secondColumnValues_1.map(function (secondColumnVal, secondColumnValIndex) {
                                return tslib_1.__spread(junctionMetadata_1.ownerColumns.map(function (column, columnIndex) {
                                    var parameterName = "firstValue_" + firstColumnValIndex + "_" + secondColumnValIndex + "_" + columnIndex;
                                    parameters_2[parameterName] = firstColumnVal instanceof Object ? column.referencedColumn.getEntityValue(firstColumnVal) : firstColumnVal;
                                    return column.databaseName + " = :" + parameterName;
                                }), junctionMetadata_1.inverseColumns.map(function (column, columnIndex) {
                                    var parameterName = "secondValue_" + firstColumnValIndex + "_" + secondColumnValIndex + "_" + columnIndex;
                                    parameters_2[parameterName] = secondColumnVal instanceof Object ? column.referencedColumn.getEntityValue(secondColumnVal) : secondColumnVal;
                                    return column.databaseName + " = :" + parameterName;
                                })).join(" AND ");
                            })));
                        });
                        condition = conditions_2.map(function (str) { return "(" + str + ")"; }).join(" OR ");
                        return [4 /*yield*/, this.queryBuilder
                                .createQueryBuilder()
                                .delete()
                                .from(junctionMetadata_1.tableName)
                                .where(condition)
                                .setParameters(parameters_2)
                                .execute()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return RelationRemover;
}());
exports.RelationRemover = RelationRemover;
//# sourceMappingURL=RelationRemover.js.map