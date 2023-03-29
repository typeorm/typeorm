"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationCountLoader = void 0;
var tslib_1 = require("tslib");
var RelationCountLoader = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationCountLoader(connection, queryRunner, relationCountAttributes) {
        this.connection = connection;
        this.queryRunner = queryRunner;
        this.relationCountAttributes = relationCountAttributes;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    RelationCountLoader.prototype.load = function (rawEntities) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var onlyUnique, promises;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                onlyUnique = function (value, index, self) {
                    return self.indexOf(value) === index;
                };
                promises = this.relationCountAttributes.map(function (relationCountAttr) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var relation, inverseRelation, referenceColumnName_1, inverseSideTable, inverseSideTableName, inverseSideTableAlias, inverseSidePropertyName, referenceColumnValues, qb, joinTableColumnName_1, inverseJoinColumnName, firstJunctionColumn, secondJunctionColumn, referenceColumnValues, junctionAlias, inverseSideTableName, inverseSideTableAlias, junctionTableName, condition, qb;
                    var _a, _b;
                    return tslib_1.__generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                if (!relationCountAttr.relation.isOneToMany) return [3 /*break*/, 2];
                                relation = relationCountAttr.relation;
                                inverseRelation = relation.inverseRelation;
                                referenceColumnName_1 = inverseRelation.joinColumns[0].referencedColumn.propertyName;
                                inverseSideTable = relation.inverseEntityMetadata.target;
                                inverseSideTableName = relation.inverseEntityMetadata.tableName;
                                inverseSideTableAlias = relationCountAttr.alias || inverseSideTableName;
                                inverseSidePropertyName = inverseRelation.propertyName;
                                referenceColumnValues = rawEntities
                                    .map(function (rawEntity) { return rawEntity[relationCountAttr.parentAlias + "_" + referenceColumnName_1]; })
                                    .filter(function (value) { return !!value; });
                                referenceColumnValues = referenceColumnValues.filter(onlyUnique);
                                // ensure we won't perform redundant queries for joined data which was not found in selection
                                // example: if post.category was not found in db then no need to execute query for category.imageIds
                                if (referenceColumnValues.length === 0)
                                    return [2 /*return*/, { relationCountAttribute: relationCountAttr, results: [] }];
                                qb = this.connection.createQueryBuilder(this.queryRunner);
                                qb.select(inverseSideTableAlias + "." + inverseSidePropertyName, "parentId")
                                    .addSelect("COUNT(*)", "cnt")
                                    .from(inverseSideTable, inverseSideTableAlias)
                                    .where(inverseSideTableAlias + "." + inverseSidePropertyName + " IN (:...ids)")
                                    .addGroupBy(inverseSideTableAlias + "." + inverseSidePropertyName)
                                    .setParameter("ids", referenceColumnValues);
                                // apply condition (custom query builder factory)
                                if (relationCountAttr.queryBuilderFactory)
                                    relationCountAttr.queryBuilderFactory(qb);
                                _a = {
                                    relationCountAttribute: relationCountAttr
                                };
                                return [4 /*yield*/, qb.getRawMany()];
                            case 1: return [2 /*return*/, (_a.results = _c.sent(),
                                    _a)];
                            case 2:
                                inverseJoinColumnName = void 0;
                                firstJunctionColumn = void 0;
                                secondJunctionColumn = void 0;
                                if (relationCountAttr.relation.isOwning) { // todo fix joinColumns[0] and inverseJoinColumns[0].
                                    joinTableColumnName_1 = relationCountAttr.relation.joinColumns[0].referencedColumn.databaseName;
                                    inverseJoinColumnName = relationCountAttr.relation.inverseJoinColumns[0].referencedColumn.databaseName;
                                    firstJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columns[0];
                                    secondJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columns[1];
                                }
                                else {
                                    joinTableColumnName_1 = relationCountAttr.relation.inverseRelation.inverseJoinColumns[0].referencedColumn.databaseName;
                                    inverseJoinColumnName = relationCountAttr.relation.inverseRelation.joinColumns[0].referencedColumn.databaseName;
                                    firstJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columns[1];
                                    secondJunctionColumn = relationCountAttr.relation.junctionEntityMetadata.columns[0];
                                }
                                referenceColumnValues = rawEntities
                                    .map(function (rawEntity) { return rawEntity[relationCountAttr.parentAlias + "_" + joinTableColumnName_1]; })
                                    .filter(function (value) { return !!value; });
                                referenceColumnValues = referenceColumnValues.filter(onlyUnique);
                                // ensure we won't perform redundant queries for joined data which was not found in selection
                                // example: if post.category was not found in db then no need to execute query for category.imageIds
                                if (referenceColumnValues.length === 0)
                                    return [2 /*return*/, { relationCountAttribute: relationCountAttr, results: [] }];
                                junctionAlias = relationCountAttr.junctionAlias;
                                inverseSideTableName = relationCountAttr.joinInverseSideMetadata.tableName;
                                inverseSideTableAlias = relationCountAttr.alias || inverseSideTableName;
                                junctionTableName = relationCountAttr.relation.junctionEntityMetadata.tableName;
                                condition = junctionAlias + "." + firstJunctionColumn.propertyName + " IN (" + referenceColumnValues.map(function (vals) { return isNaN(vals) ? "'" + vals + "'" : vals; }) + ")" +
                                    " AND " + junctionAlias + "." + secondJunctionColumn.propertyName + " = " + inverseSideTableAlias + "." + inverseJoinColumnName;
                                qb = this.connection.createQueryBuilder(this.queryRunner);
                                qb.select(junctionAlias + "." + firstJunctionColumn.propertyName, "parentId")
                                    .addSelect("COUNT(" + qb.escape(inverseSideTableAlias) + "." + qb.escape(inverseJoinColumnName) + ")", "cnt")
                                    .from(inverseSideTableName, inverseSideTableAlias)
                                    .innerJoin(junctionTableName, junctionAlias, condition)
                                    .addGroupBy(junctionAlias + "." + firstJunctionColumn.propertyName);
                                // apply condition (custom query builder factory)
                                if (relationCountAttr.queryBuilderFactory)
                                    relationCountAttr.queryBuilderFactory(qb);
                                _b = {
                                    relationCountAttribute: relationCountAttr
                                };
                                return [4 /*yield*/, qb.getRawMany()];
                            case 3: return [2 /*return*/, (_b.results = _c.sent(),
                                    _b)];
                        }
                    });
                }); });
                return [2 /*return*/, Promise.all(promises)];
            });
        });
    };
    return RelationCountLoader;
}());
exports.RelationCountLoader = RelationCountLoader;

//# sourceMappingURL=RelationCountLoader.js.map
