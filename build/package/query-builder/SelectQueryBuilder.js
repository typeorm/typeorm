"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectQueryBuilder = void 0;
var tslib_1 = require("tslib");
var SapDriver_1 = require("../driver/sap/SapDriver");
var RawSqlResultsToEntityTransformer_1 = require("./transformer/RawSqlResultsToEntityTransformer");
var SqlServerDriver_1 = require("../driver/sqlserver/SqlServerDriver");
var PessimisticLockTransactionRequiredError_1 = require("../error/PessimisticLockTransactionRequiredError");
var NoVersionOrUpdateDateColumnError_1 = require("../error/NoVersionOrUpdateDateColumnError");
var OptimisticLockVersionMismatchError_1 = require("../error/OptimisticLockVersionMismatchError");
var OptimisticLockCanNotBeUsedError_1 = require("../error/OptimisticLockCanNotBeUsedError");
var JoinAttribute_1 = require("./JoinAttribute");
var RelationIdAttribute_1 = require("./relation-id/RelationIdAttribute");
var RelationCountAttribute_1 = require("./relation-count/RelationCountAttribute");
var RelationIdLoader_1 = require("./relation-id/RelationIdLoader");
var RelationIdMetadataToAttributeTransformer_1 = require("./relation-id/RelationIdMetadataToAttributeTransformer");
var RelationCountLoader_1 = require("./relation-count/RelationCountLoader");
var RelationCountMetadataToAttributeTransformer_1 = require("./relation-count/RelationCountMetadataToAttributeTransformer");
var QueryBuilder_1 = require("./QueryBuilder");
var LockNotSupportedOnGivenDriverError_1 = require("../error/LockNotSupportedOnGivenDriverError");
var MysqlDriver_1 = require("../driver/mysql/MysqlDriver");
var PostgresDriver_1 = require("../driver/postgres/PostgresDriver");
var OracleDriver_1 = require("../driver/oracle/OracleDriver");
var AbstractSqliteDriver_1 = require("../driver/sqlite-abstract/AbstractSqliteDriver");
var OffsetWithoutLimitNotSupportedError_1 = require("../error/OffsetWithoutLimitNotSupportedError");
var BroadcasterResult_1 = require("../subscriber/BroadcasterResult");
var ObjectUtils_1 = require("../util/ObjectUtils");
var DriverUtils_1 = require("../driver/DriverUtils");
var AuroraDataApiDriver_1 = require("../driver/aurora-data-api/AuroraDataApiDriver");
var CockroachDriver_1 = require("../driver/cockroachdb/CockroachDriver");
var EntityNotFoundError_1 = require("../error/EntityNotFoundError");
/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
var SelectQueryBuilder = /** @class */ (function (_super) {
    tslib_1.__extends(SelectQueryBuilder, _super);
    function SelectQueryBuilder() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // -------------------------------------------------------------------------
    // Public Implemented Methods
    // -------------------------------------------------------------------------
    /**
     * Gets generated sql query without parameters being replaced.
     */
    SelectQueryBuilder.prototype.getQuery = function () {
        var sql = this.createComment();
        sql += this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitOffsetExpression();
        sql += this.createLockExpression();
        sql = sql.trim();
        if (this.expressionMap.subQuery)
            sql = "(" + sql + ")";
        return sql;
    };
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a subquery - query that can be used inside other queries.
     */
    SelectQueryBuilder.prototype.subQuery = function () {
        var qb = this.createQueryBuilder();
        qb.expressionMap.subQuery = true;
        qb.expressionMap.parentQueryBuilder = this;
        return qb;
    };
    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    SelectQueryBuilder.prototype.select = function (selection, selectionAliasName) {
        this.expressionMap.queryType = "select";
        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map(function (selection) { return ({ selection: selection }); });
        }
        else if (selection instanceof Function) {
            var subQueryBuilder = selection(this.subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            this.expressionMap.selects.push({ selection: subQueryBuilder.getQuery(), aliasName: selectionAliasName });
        }
        else if (selection) {
            this.expressionMap.selects = [{ selection: selection, aliasName: selectionAliasName }];
        }
        return this;
    };
    /**
     * Adds new selection to the SELECT query.
     */
    SelectQueryBuilder.prototype.addSelect = function (selection, selectionAliasName) {
        if (!selection)
            return this;
        if (Array.isArray(selection)) {
            this.expressionMap.selects = this.expressionMap.selects.concat(selection.map(function (selection) { return ({ selection: selection }); }));
        }
        else if (selection instanceof Function) {
            var subQueryBuilder = selection(this.subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            this.expressionMap.selects.push({ selection: subQueryBuilder.getQuery(), aliasName: selectionAliasName });
        }
        else if (selection) {
            this.expressionMap.selects.push({ selection: selection, aliasName: selectionAliasName });
        }
        return this;
    };
    /**
     * Sets whether the selection is DISTINCT.
     */
    SelectQueryBuilder.prototype.distinct = function (distinct) {
        if (distinct === void 0) { distinct = true; }
        this.expressionMap.selectDistinct = distinct;
        return this;
    };
    /**
     * Sets the distinct on clause for Postgres.
     */
    SelectQueryBuilder.prototype.distinctOn = function (distinctOn) {
        this.expressionMap.selectDistinctOn = distinctOn;
        return this;
    };
    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     * Removes all previously set from-s.
     */
    SelectQueryBuilder.prototype.from = function (entityTarget, aliasName) {
        var mainAlias = this.createFromAlias(entityTarget, aliasName);
        this.expressionMap.setMainAlias(mainAlias);
        return this;
    };
    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    SelectQueryBuilder.prototype.addFrom = function (entityTarget, aliasName) {
        var alias = this.createFromAlias(entityTarget, aliasName);
        if (!this.expressionMap.mainAlias)
            this.expressionMap.setMainAlias(alias);
        return this;
    };
    /**
     * INNER JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoin = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.join("INNER", entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * LEFT JOINs (without selection).
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoin = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.join("LEFT", entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * INNER JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoinAndSelect = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.innerJoin(entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * LEFT JOINs and adds all selection properties to SELECT.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoinAndSelect = function (entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.leftJoin(entityOrProperty, alias, condition, parameters);
        return this;
    };
    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoinAndMapMany = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("INNER", entityOrProperty, alias, condition, parameters, mapToProperty, true);
        return this;
    };
    /**
     * INNER JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.innerJoinAndMapOne = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("INNER", entityOrProperty, alias, condition, parameters, mapToProperty, false);
        return this;
    };
    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there are multiple rows of selecting data, and mapped result will be an array.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoinAndMapMany = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("LEFT", entityOrProperty, alias, condition, parameters, mapToProperty, true);
        return this;
    };
    /**
     * LEFT JOINs, SELECTs the data returned by a join and MAPs all that data to some entity's property.
     * This is extremely useful when you want to select some data and map it to some virtual property.
     * It will assume that there is a single row of selecting data, and mapped result will be a single selected value.
     * You also need to specify an alias of the joined data.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.leftJoinAndMapOne = function (mapToProperty, entityOrProperty, alias, condition, parameters) {
        if (condition === void 0) { condition = ""; }
        this.addSelect(alias);
        this.join("LEFT", entityOrProperty, alias, condition, parameters, mapToProperty, false);
        return this;
    };
    /**
     * LEFT JOINs relation id and maps it into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.loadRelationIdAndMap = function (mapToProperty, relationName, aliasNameOrOptions, queryBuilderFactory) {
        var relationIdAttribute = new RelationIdAttribute_1.RelationIdAttribute(this.expressionMap);
        relationIdAttribute.mapToProperty = mapToProperty;
        relationIdAttribute.relationName = relationName;
        if (typeof aliasNameOrOptions === "string")
            relationIdAttribute.alias = aliasNameOrOptions;
        if (aliasNameOrOptions instanceof Object && aliasNameOrOptions.disableMixedMap)
            relationIdAttribute.disableMixedMap = true;
        relationIdAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationIdAttributes.push(relationIdAttribute);
        if (relationIdAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationIdAttribute.junctionAlias,
                metadata: relationIdAttribute.relation.junctionEntityMetadata
            });
        }
        return this;
    };
    /**
     * Counts number of entities of entity's relation and maps the value into some entity's property.
     * Optionally, you can add condition and parameters used in condition.
     */
    SelectQueryBuilder.prototype.loadRelationCountAndMap = function (mapToProperty, relationName, aliasName, queryBuilderFactory) {
        var relationCountAttribute = new RelationCountAttribute_1.RelationCountAttribute(this.expressionMap);
        relationCountAttribute.mapToProperty = mapToProperty;
        relationCountAttribute.relationName = relationName;
        relationCountAttribute.alias = aliasName;
        relationCountAttribute.queryBuilderFactory = queryBuilderFactory;
        this.expressionMap.relationCountAttributes.push(relationCountAttribute);
        this.expressionMap.createAlias({
            type: "other",
            name: relationCountAttribute.junctionAlias
        });
        if (relationCountAttribute.relation.junctionEntityMetadata) {
            this.expressionMap.createAlias({
                type: "other",
                name: relationCountAttribute.junctionAlias,
                metadata: relationCountAttribute.relation.junctionEntityMetadata
            });
        }
        return this;
    };
    /**
     * Loads all relation ids for all relations of the selected entity.
     * All relation ids will be mapped to relation property themself.
     * If array of strings is given then loads only relation ids of the given properties.
     */
    SelectQueryBuilder.prototype.loadAllRelationIds = function (options) {
        var _this = this;
        this.expressionMap.mainAlias.metadata.relations.forEach(function (relation) {
            if (options !== undefined && options.relations !== undefined && options.relations.indexOf(relation.propertyPath) === -1)
                return;
            _this.loadRelationIdAndMap(_this.expressionMap.mainAlias.name + "." + relation.propertyPath, _this.expressionMap.mainAlias.name + "." + relation.propertyPath, options);
        });
        return this;
    };
    /**
     * Sets WHERE condition in the query builder.
     * If you had previously WHERE expression defined,
     * calling this function will override previously set WHERE conditions.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.where = function (where, parameters) {
        this.expressionMap.wheres = []; // don't move this block below since computeWhereParameter can add where expressions
        var condition = this.computeWhereParameter(where);
        if (condition)
            this.expressionMap.wheres = [{ type: "simple", condition: condition }];
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.andWhere = function (where, parameters) {
        this.expressionMap.wheres.push({ type: "and", condition: this.computeWhereParameter(where) });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new OR WHERE condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.orWhere = function (where, parameters) {
        this.expressionMap.wheres.push({ type: "or", condition: this.computeWhereParameter(where) });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    SelectQueryBuilder.prototype.whereInIds = function (ids) {
        return this.where(this.createWhereIdsExpression(ids));
    };
    /**
     * Adds new AND WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    SelectQueryBuilder.prototype.andWhereInIds = function (ids) {
        return this.andWhere(this.createWhereIdsExpression(ids));
    };
    /**
     * Adds new OR WHERE with conditions for the given ids.
     *
     * Ids are mixed.
     * It means if you have single primary key you can pass a simple id values, for example [1, 2, 3].
     * If you have multiple primary keys you need to pass object with property names and values specified,
     * for example [{ firstId: 1, secondId: 2 }, { firstId: 2, secondId: 3 }, ...]
     */
    SelectQueryBuilder.prototype.orWhereInIds = function (ids) {
        return this.orWhere(this.createWhereIdsExpression(ids));
    };
    /**
     * Sets HAVING condition in the query builder.
     * If you had previously HAVING expression defined,
     * calling this function will override previously set HAVING conditions.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.having = function (having, parameters) {
        this.expressionMap.havings.push({ type: "simple", condition: having });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new AND HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.andHaving = function (having, parameters) {
        this.expressionMap.havings.push({ type: "and", condition: having });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Adds new OR HAVING condition in the query builder.
     * Additionally you can add parameters used in where expression.
     */
    SelectQueryBuilder.prototype.orHaving = function (having, parameters) {
        this.expressionMap.havings.push({ type: "or", condition: having });
        if (parameters)
            this.setParameters(parameters);
        return this;
    };
    /**
     * Sets GROUP BY condition in the query builder.
     * If you had previously GROUP BY expression defined,
     * calling this function will override previously set GROUP BY conditions.
     */
    SelectQueryBuilder.prototype.groupBy = function (groupBy) {
        if (groupBy) {
            this.expressionMap.groupBys = [groupBy];
        }
        else {
            this.expressionMap.groupBys = [];
        }
        return this;
    };
    /**
     * Adds GROUP BY condition in the query builder.
     */
    SelectQueryBuilder.prototype.addGroupBy = function (groupBy) {
        this.expressionMap.groupBys.push(groupBy);
        return this;
    };
    /**
     * Sets ORDER BY condition in the query builder.
     * If you had previously ORDER BY expression defined,
     * calling this function will override previously set ORDER BY conditions.
     */
    SelectQueryBuilder.prototype.orderBy = function (sort, order, nulls) {
        var _a, _b;
        if (order === void 0) { order = "ASC"; }
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error("SelectQueryBuilder.addOrderBy \"order\" can accept only \"ASC\" and \"DESC\" values.");
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error("SelectQueryBuilder.addOrderBy \"nulls\" can accept only \"NULLS FIRST\" and \"NULLS LAST\" values.");
        if (sort) {
            if (sort instanceof Object) {
                this.expressionMap.orderBys = sort;
            }
            else {
                if (nulls) {
                    this.expressionMap.orderBys = (_a = {}, _a[sort] = { order: order, nulls: nulls }, _a);
                }
                else {
                    this.expressionMap.orderBys = (_b = {}, _b[sort] = order, _b);
                }
            }
        }
        else {
            this.expressionMap.orderBys = {};
        }
        return this;
    };
    /**
     * Adds ORDER BY condition in the query builder.
     */
    SelectQueryBuilder.prototype.addOrderBy = function (sort, order, nulls) {
        if (order === void 0) { order = "ASC"; }
        if (order !== undefined && order !== "ASC" && order !== "DESC")
            throw new Error("SelectQueryBuilder.addOrderBy \"order\" can accept only \"ASC\" and \"DESC\" values.");
        if (nulls !== undefined && nulls !== "NULLS FIRST" && nulls !== "NULLS LAST")
            throw new Error("SelectQueryBuilder.addOrderBy \"nulls\" can accept only \"NULLS FIRST\" and \"NULLS LAST\" values.");
        if (nulls) {
            this.expressionMap.orderBys[sort] = { order: order, nulls: nulls };
        }
        else {
            this.expressionMap.orderBys[sort] = order;
        }
        return this;
    };
    /**
     * Set's LIMIT - maximum number of rows to be selected.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead take method instead.
     */
    SelectQueryBuilder.prototype.limit = function (limit) {
        this.expressionMap.limit = this.normalizeNumber(limit);
        if (this.expressionMap.limit !== undefined && isNaN(this.expressionMap.limit))
            throw new Error("Provided \"limit\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Set's OFFSET - selection offset.
     * NOTE that it may not work as you expect if you are using joins.
     * If you want to implement pagination, and you are having join in your query,
     * then use instead skip method instead.
     */
    SelectQueryBuilder.prototype.offset = function (offset) {
        this.expressionMap.offset = this.normalizeNumber(offset);
        if (this.expressionMap.offset !== undefined && isNaN(this.expressionMap.offset))
            throw new Error("Provided \"offset\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Sets maximal number of entities to take.
     */
    SelectQueryBuilder.prototype.take = function (take) {
        this.expressionMap.take = this.normalizeNumber(take);
        if (this.expressionMap.take !== undefined && isNaN(this.expressionMap.take))
            throw new Error("Provided \"take\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Sets number of entities to skip.
     */
    SelectQueryBuilder.prototype.skip = function (skip) {
        this.expressionMap.skip = this.normalizeNumber(skip);
        if (this.expressionMap.skip !== undefined && isNaN(this.expressionMap.skip))
            throw new Error("Provided \"skip\" value is not a number. Please provide a numeric value.");
        return this;
    };
    /**
     * Sets locking mode.
     */
    SelectQueryBuilder.prototype.setLock = function (lockMode, lockVersion, lockTables) {
        this.expressionMap.lockMode = lockMode;
        this.expressionMap.lockVersion = lockVersion;
        this.expressionMap.lockTables = lockTables;
        return this;
    };
    /**
     * Disables the global condition of "non-deleted" for the entity with delete date columns.
     */
    SelectQueryBuilder.prototype.withDeleted = function () {
        this.expressionMap.withDeleted = true;
        return this;
    };
    /**
     * Gets first raw result returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getRawOne = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRawMany()];
                    case 1: return [2 /*return*/, (_a.sent())[0]];
                }
            });
        });
    };
    /**
     * Gets all raw results returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getRawMany = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, results, error_1, rollbackError_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        this.expressionMap.queryEntity = false;
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 12, 15]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3: return [4 /*yield*/, this.loadRawResults(queryRunner)];
                    case 4:
                        results = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 6];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, results];
                    case 7:
                        error_1 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 11];
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        rollbackError_1 = _a.sent();
                        return [3 /*break*/, 11];
                    case 11: throw error_1;
                    case 12:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 14];
                        return [4 /*yield*/, queryRunner.release()];
                    case 13:
                        _a.sent();
                        _a.label = 14;
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    SelectQueryBuilder.prototype.getRawAndEntities = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, results, error_2, rollbackError_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 12, 15]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3:
                        this.expressionMap.queryEntity = true;
                        return [4 /*yield*/, this.executeEntitiesAndRawResults(queryRunner)];
                    case 4:
                        results = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 6];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, results];
                    case 7:
                        error_2 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 11];
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        rollbackError_2 = _a.sent();
                        return [3 /*break*/, 11];
                    case 11: throw error_2;
                    case 12:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 14];
                        return [4 /*yield*/, queryRunner.release()];
                    case 13:
                        _a.sent();
                        _a.label = 14;
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets single entity returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getOne = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var results, result, metadata, actualVersion, actualVersion;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getRawAndEntities()];
                    case 1:
                        results = _a.sent();
                        result = results.entities[0];
                        if (result && this.expressionMap.lockMode === "optimistic" && this.expressionMap.lockVersion) {
                            metadata = this.expressionMap.mainAlias.metadata;
                            if (this.expressionMap.lockVersion instanceof Date) {
                                actualVersion = metadata.updateDateColumn.getEntityValue(result);
                                if (actualVersion.getTime() !== this.expressionMap.lockVersion.getTime())
                                    throw new OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);
                            }
                            else {
                                actualVersion = metadata.versionColumn.getEntityValue(result);
                                if (actualVersion !== this.expressionMap.lockVersion)
                                    throw new OptimisticLockVersionMismatchError_1.OptimisticLockVersionMismatchError(metadata.name, this.expressionMap.lockVersion, actualVersion);
                            }
                        }
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Gets the first entity returned by execution of generated query builder sql or rejects the returned promise on error.
     */
    SelectQueryBuilder.prototype.getOneOrFail = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entity;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getOne()];
                    case 1:
                        entity = _a.sent();
                        if (!entity) {
                            throw new EntityNotFoundError_1.EntityNotFoundError(this.expressionMap.mainAlias.target, this);
                        }
                        return [2 /*return*/, entity];
                }
            });
        });
    };
    /**
     * Gets entities returned by execution of generated query builder sql.
     */
    SelectQueryBuilder.prototype.getMany = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var results;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        return [4 /*yield*/, this.getRawAndEntities()];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.entities];
                }
            });
        });
    };
    /**
     * Gets count - number of entities selected by sql generated by this query builder.
     * Count excludes all limitations set by setFirstResult and setMaxResults methods call.
     */
    SelectQueryBuilder.prototype.getCount = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, results, error_3, rollbackError_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, 12, 15]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3:
                        this.expressionMap.queryEntity = false;
                        return [4 /*yield*/, this.executeCountQuery(queryRunner)];
                    case 4:
                        results = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 6];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [2 /*return*/, results];
                    case 7:
                        error_3 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 11];
                        _a.label = 8;
                    case 8:
                        _a.trys.push([8, 10, , 11]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 9:
                        _a.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        rollbackError_3 = _a.sent();
                        return [3 /*break*/, 11];
                    case 11: throw error_3;
                    case 12:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 14];
                        return [4 /*yield*/, queryRunner.release()];
                    case 13:
                        _a.sent();
                        _a.label = 14;
                    case 14: return [7 /*endfinally*/];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes built SQL query and returns entities and overall entities count (without limitation).
     * This method is useful to build pagination.
     */
    SelectQueryBuilder.prototype.getManyAndCount = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var queryRunner, transactionStartedByUs, entitiesAndRaw, count, results, error_4, rollbackError_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.expressionMap.lockMode === "optimistic")
                            throw new OptimisticLockCanNotBeUsedError_1.OptimisticLockCanNotBeUsedError();
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, 13, 16]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _a.sent();
                        transactionStartedByUs = true;
                        _a.label = 3;
                    case 3:
                        this.expressionMap.queryEntity = true;
                        return [4 /*yield*/, this.executeEntitiesAndRawResults(queryRunner)];
                    case 4:
                        entitiesAndRaw = _a.sent();
                        this.expressionMap.queryEntity = false;
                        return [4 /*yield*/, this.executeCountQuery(queryRunner)];
                    case 5:
                        count = _a.sent();
                        results = [entitiesAndRaw.entities, count];
                        if (!transactionStartedByUs) return [3 /*break*/, 7];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [2 /*return*/, results];
                    case 8:
                        error_4 = _a.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 12];
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        rollbackError_4 = _a.sent();
                        return [3 /*break*/, 12];
                    case 12: throw error_4;
                    case 13:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 15];
                        return [4 /*yield*/, queryRunner.release()];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15: return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Executes built SQL query and returns raw data stream.
     */
    SelectQueryBuilder.prototype.stream = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, sql, parameters, queryRunner, transactionStartedByUs, releaseFn, results, error_5, rollbackError_5;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.expressionMap.queryEntity = false;
                        _a = tslib_1.__read(this.getQueryAndParameters(), 2), sql = _a[0], parameters = _a[1];
                        queryRunner = this.obtainQueryRunner();
                        transactionStartedByUs = false;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 6, , 11]);
                        if (!(this.expressionMap.useTransaction === true && queryRunner.isTransactionActive === false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, queryRunner.startTransaction()];
                    case 2:
                        _b.sent();
                        transactionStartedByUs = true;
                        _b.label = 3;
                    case 3:
                        releaseFn = function () {
                            if (queryRunner !== _this.queryRunner) // means we created our own query runner
                                return queryRunner.release();
                            return;
                        };
                        results = queryRunner.stream(sql, parameters, releaseFn, releaseFn);
                        if (!transactionStartedByUs) return [3 /*break*/, 5];
                        return [4 /*yield*/, queryRunner.commitTransaction()];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/, results];
                    case 6:
                        error_5 = _b.sent();
                        if (!transactionStartedByUs) return [3 /*break*/, 10];
                        _b.label = 7;
                    case 7:
                        _b.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, queryRunner.rollbackTransaction()];
                    case 8:
                        _b.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        rollbackError_5 = _b.sent();
                        return [3 /*break*/, 10];
                    case 10: throw error_5;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enables or disables query result caching.
     */
    SelectQueryBuilder.prototype.cache = function (enabledOrMillisecondsOrId, maybeMilliseconds) {
        if (typeof enabledOrMillisecondsOrId === "boolean") {
            this.expressionMap.cache = enabledOrMillisecondsOrId;
        }
        else if (typeof enabledOrMillisecondsOrId === "number") {
            this.expressionMap.cache = true;
            this.expressionMap.cacheDuration = enabledOrMillisecondsOrId;
        }
        else if (typeof enabledOrMillisecondsOrId === "string" || typeof enabledOrMillisecondsOrId === "number") {
            this.expressionMap.cache = true;
            this.expressionMap.cacheId = enabledOrMillisecondsOrId;
        }
        if (maybeMilliseconds) {
            this.expressionMap.cacheDuration = maybeMilliseconds;
        }
        return this;
    };
    /**
     * Sets extra options that can be used to configure how query builder works.
     */
    SelectQueryBuilder.prototype.setOption = function (option) {
        this.expressionMap.options.push(option);
        return this;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    SelectQueryBuilder.prototype.join = function (direction, entityOrProperty, aliasName, condition, parameters, mapToProperty, isMappingMany) {
        this.setParameters(parameters || {});
        var joinAttribute = new JoinAttribute_1.JoinAttribute(this.connection, this.expressionMap);
        joinAttribute.direction = direction;
        joinAttribute.mapToProperty = mapToProperty;
        joinAttribute.isMappingMany = isMappingMany;
        joinAttribute.entityOrProperty = entityOrProperty; // relationName
        joinAttribute.condition = condition; // joinInverseSideCondition
        // joinAttribute.junctionAlias = joinAttribute.relation.isOwning ? parentAlias + "_" + destinationTableAlias : destinationTableAlias + "_" + parentAlias;
        this.expressionMap.joinAttributes.push(joinAttribute);
        if (joinAttribute.metadata) {
            if (joinAttribute.metadata.deleteDateColumn && !this.expressionMap.withDeleted) {
                var conditionDeleteColumn = aliasName + "." + joinAttribute.metadata.deleteDateColumn.propertyName + " IS NULL";
                joinAttribute.condition += joinAttribute.condition ? " AND " + conditionDeleteColumn : "" + conditionDeleteColumn;
            }
            // todo: find and set metadata right there?
            joinAttribute.alias = this.expressionMap.createAlias({
                type: "join",
                name: aliasName,
                metadata: joinAttribute.metadata
            });
            if (joinAttribute.relation && joinAttribute.relation.junctionEntityMetadata) {
                this.expressionMap.createAlias({
                    type: "join",
                    name: joinAttribute.junctionAlias,
                    metadata: joinAttribute.relation.junctionEntityMetadata
                });
            }
        }
        else {
            var subQuery = "";
            if (entityOrProperty instanceof Function) {
                var subQueryBuilder = entityOrProperty(this.subQuery());
                this.setParameters(subQueryBuilder.getParameters());
                subQuery = subQueryBuilder.getQuery();
            }
            else {
                subQuery = entityOrProperty;
            }
            var isSubQuery = entityOrProperty instanceof Function || entityOrProperty.substr(0, 1) === "(" && entityOrProperty.substr(-1) === ")";
            joinAttribute.alias = this.expressionMap.createAlias({
                type: "join",
                name: aliasName,
                tablePath: isSubQuery === false ? entityOrProperty : undefined,
                subQuery: isSubQuery === true ? subQuery : undefined,
            });
        }
    };
    /**
     * Creates "SELECT FROM" part of SQL query.
     */
    SelectQueryBuilder.prototype.createSelectExpression = function () {
        var _this = this;
        if (!this.expressionMap.mainAlias)
            throw new Error("Cannot build query because main alias is not set (call qb#from method)");
        // todo throw exception if selects or from is missing
        var allSelects = [];
        var excludedSelects = [];
        if (this.expressionMap.mainAlias.hasMetadata) {
            var metadata = this.expressionMap.mainAlias.metadata;
            allSelects.push.apply(allSelects, tslib_1.__spreadArray([], tslib_1.__read(this.buildEscapedEntityColumnSelects(this.expressionMap.mainAlias.name, metadata))));
            excludedSelects.push.apply(excludedSelects, tslib_1.__spreadArray([], tslib_1.__read(this.findEntityColumnSelects(this.expressionMap.mainAlias.name, metadata))));
        }
        // add selects from joins
        this.expressionMap.joinAttributes
            .forEach(function (join) {
            if (join.metadata) {
                allSelects.push.apply(allSelects, tslib_1.__spreadArray([], tslib_1.__read(_this.buildEscapedEntityColumnSelects(join.alias.name, join.metadata))));
                excludedSelects.push.apply(excludedSelects, tslib_1.__spreadArray([], tslib_1.__read(_this.findEntityColumnSelects(join.alias.name, join.metadata))));
            }
            else {
                var hasMainAlias = _this.expressionMap.selects.some(function (select) { return select.selection === join.alias.name; });
                if (hasMainAlias) {
                    allSelects.push({ selection: _this.escape(join.alias.name) + ".*" });
                    var excludedSelect = _this.expressionMap.selects.find(function (select) { return select.selection === join.alias.name; });
                    excludedSelects.push(excludedSelect);
                }
            }
        });
        // add all other selects
        this.expressionMap.selects
            .filter(function (select) { return excludedSelects.indexOf(select) === -1; })
            .forEach(function (select) { return allSelects.push({ selection: _this.replacePropertyNames(select.selection), aliasName: select.aliasName }); });
        // if still selection is empty, then simply set it to all (*)
        if (allSelects.length === 0)
            allSelects.push({ selection: "*" });
        var lock = "";
        if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
            switch (this.expressionMap.lockMode) {
                case "pessimistic_read":
                    lock = " WITH (HOLDLOCK, ROWLOCK)";
                    break;
                case "pessimistic_write":
                    lock = " WITH (UPDLOCK, ROWLOCK)";
                    break;
                case "dirty_read":
                    lock = " WITH (NOLOCK)";
                    break;
            }
        }
        // create a selection query
        var froms = this.expressionMap.aliases
            .filter(function (alias) { return alias.type === "from" && (alias.tablePath || alias.subQuery); })
            .map(function (alias) {
            if (alias.subQuery)
                return alias.subQuery + " " + _this.escape(alias.name);
            return _this.getTableName(alias.tablePath) + " " + _this.escape(alias.name);
        });
        var select = this.createSelectDistinctExpression();
        var selection = allSelects.map(function (select) { return select.selection + (select.aliasName ? " AS " + _this.escape(select.aliasName) : ""); }).join(", ");
        return select + selection + " FROM " + froms.join(", ") + lock;
    };
    /**
     * Creates select | select distinct part of SQL query.
     */
    SelectQueryBuilder.prototype.createSelectDistinctExpression = function () {
        var _this = this;
        var _a = this.expressionMap, selectDistinct = _a.selectDistinct, selectDistinctOn = _a.selectDistinctOn;
        var driver = this.connection.driver;
        var select = "SELECT ";
        if (driver instanceof PostgresDriver_1.PostgresDriver && selectDistinctOn.length > 0) {
            var selectDistinctOnMap = selectDistinctOn.map(function (on) { return _this.replacePropertyNames(on); }).join(", ");
            select = "SELECT DISTINCT ON (" + selectDistinctOnMap + ") ";
        }
        else if (selectDistinct) {
            select = "SELECT DISTINCT ";
        }
        return select;
    };
    /**
     * Creates "JOIN" part of SQL query.
     */
    SelectQueryBuilder.prototype.createJoinExpression = function () {
        // examples:
        // select from owning side
        // qb.select("post")
        //     .leftJoinAndSelect("post.category", "category");
        // select from non-owning side
        // qb.select("category")
        //     .leftJoinAndSelect("category.post", "post");
        var _this = this;
        var joins = this.expressionMap.joinAttributes.map(function (joinAttr) {
            var relation = joinAttr.relation;
            var destinationTableName = joinAttr.tablePath;
            var destinationTableAlias = joinAttr.alias.name;
            var appendedCondition = joinAttr.condition ? " AND (" + joinAttr.condition + ")" : "";
            var parentAlias = joinAttr.parentAlias;
            // if join was build without relation (e.g. without "post.category") then it means that we have direct
            // table to join, without junction table involved. This means we simply join direct table.
            if (!parentAlias || !relation) {
                var destinationJoin = joinAttr.alias.subQuery ? joinAttr.alias.subQuery : _this.getTableName(destinationTableName);
                return " " + joinAttr.direction + " JOIN " + destinationJoin + " " + _this.escape(destinationTableAlias) +
                    (joinAttr.condition ? " ON " + _this.replacePropertyNames(joinAttr.condition) : "");
            }
            // if real entity relation is involved
            if (relation.isManyToOne || relation.isOneToOneOwner) {
                // JOIN `category` `category` ON `category`.`id` = `post`.`categoryId`
                var condition = relation.joinColumns.map(function (joinColumn) {
                    return destinationTableAlias + "." + joinColumn.referencedColumn.propertyPath + "=" +
                        parentAlias + "." + relation.propertyPath + "." + joinColumn.referencedColumn.propertyPath;
                }).join(" AND ");
                return " " + joinAttr.direction + " JOIN " + _this.getTableName(destinationTableName) + " " + _this.escape(destinationTableAlias) + " ON " + _this.replacePropertyNames(condition + appendedCondition);
            }
            else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                // JOIN `post` `post` ON `post`.`categoryId` = `category`.`id`
                var condition = relation.inverseRelation.joinColumns.map(function (joinColumn) {
                    if (relation.inverseEntityMetadata.tableType === "entity-child" && relation.inverseEntityMetadata.discriminatorColumn) {
                        appendedCondition += " AND " + destinationTableAlias + "." + relation.inverseEntityMetadata.discriminatorColumn.databaseName + "='" + relation.inverseEntityMetadata.discriminatorValue + "'";
                    }
                    return destinationTableAlias + "." + relation.inverseRelation.propertyPath + "." + joinColumn.referencedColumn.propertyPath + "=" +
                        parentAlias + "." + joinColumn.referencedColumn.propertyPath;
                }).join(" AND ");
                return " " + joinAttr.direction + " JOIN " + _this.getTableName(destinationTableName) + " " + _this.escape(destinationTableAlias) + " ON " + _this.replacePropertyNames(condition + appendedCondition);
            }
            else { // means many-to-many
                var junctionTableName = relation.junctionEntityMetadata.tablePath;
                var junctionAlias_1 = joinAttr.junctionAlias;
                var junctionCondition = "", destinationCondition = "";
                if (relation.isOwning) {
                    junctionCondition = relation.joinColumns.map(function (joinColumn) {
                        // `post_category`.`postId` = `post`.`id`
                        return junctionAlias_1 + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn.propertyPath;
                    }).join(" AND ");
                    destinationCondition = relation.inverseJoinColumns.map(function (joinColumn) {
                        // `category`.`id` = `post_category`.`categoryId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn.propertyPath + "=" + junctionAlias_1 + "." + joinColumn.propertyPath;
                    }).join(" AND ");
                }
                else {
                    junctionCondition = relation.inverseRelation.inverseJoinColumns.map(function (joinColumn) {
                        // `post_category`.`categoryId` = `category`.`id`
                        return junctionAlias_1 + "." + joinColumn.propertyPath + "=" + parentAlias + "." + joinColumn.referencedColumn.propertyPath;
                    }).join(" AND ");
                    destinationCondition = relation.inverseRelation.joinColumns.map(function (joinColumn) {
                        // `post`.`id` = `post_category`.`postId`
                        return destinationTableAlias + "." + joinColumn.referencedColumn.propertyPath + "=" + junctionAlias_1 + "." + joinColumn.propertyPath;
                    }).join(" AND ");
                }
                return " " + joinAttr.direction + " JOIN " + _this.getTableName(junctionTableName) + " " + _this.escape(junctionAlias_1) + " ON " + _this.replacePropertyNames(junctionCondition) +
                    " " + joinAttr.direction + " JOIN " + _this.getTableName(destinationTableName) + " " + _this.escape(destinationTableAlias) + " ON " + _this.replacePropertyNames(destinationCondition + appendedCondition);
            }
        });
        return joins.join(" ");
    };
    /**
     * Creates "GROUP BY" part of SQL query.
     */
    SelectQueryBuilder.prototype.createGroupByExpression = function () {
        if (!this.expressionMap.groupBys || !this.expressionMap.groupBys.length)
            return "";
        return " GROUP BY " + this.replacePropertyNames(this.expressionMap.groupBys.join(", "));
    };
    /**
     * Creates "ORDER BY" part of SQL query.
     */
    SelectQueryBuilder.prototype.createOrderByExpression = function () {
        var _this = this;
        var orderBys = this.expressionMap.allOrderBys;
        if (Object.keys(orderBys).length > 0)
            return " ORDER BY " + Object.keys(orderBys)
                .map(function (columnName) {
                if (typeof orderBys[columnName] === "string") {
                    return _this.replacePropertyNames(columnName) + " " + orderBys[columnName];
                }
                else {
                    return _this.replacePropertyNames(columnName) + " " + orderBys[columnName].order + " " + orderBys[columnName].nulls;
                }
            })
                .join(", ");
        return "";
    };
    /**
     * Creates "LIMIT" and "OFFSET" parts of SQL query.
     */
    SelectQueryBuilder.prototype.createLimitOffsetExpression = function () {
        // in the case if nothing is joined in the query builder we don't need to make two requests to get paginated results
        // we can use regular limit / offset, that's why we add offset and limit construction here based on skip and take values
        var offset = this.expressionMap.offset, limit = this.expressionMap.limit;
        if (!offset && !limit && this.expressionMap.joinAttributes.length === 0) {
            offset = this.expressionMap.skip;
            limit = this.expressionMap.take;
        }
        if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
            // Due to a limitation in SQL Server's parser implementation it does not support using
            // OFFSET or FETCH NEXT without an ORDER BY clause being provided. In cases where the
            // user does not request one we insert a dummy ORDER BY that does nothing and should
            // have no effect on the query planner or on the order of the results returned.
            // https://dba.stackexchange.com/a/193799
            var prefix = "";
            if ((limit || offset) && Object.keys(this.expressionMap.allOrderBys).length <= 0) {
                prefix = " ORDER BY (SELECT NULL)";
            }
            if (limit && offset)
                return prefix + " OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (limit)
                return prefix + " OFFSET 0 ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (offset)
                return prefix + " OFFSET " + offset + " ROWS";
        }
        else if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver || this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver || this.connection.driver instanceof SapDriver_1.SapDriver) {
            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                throw new OffsetWithoutLimitNotSupportedError_1.OffsetWithoutLimitNotSupportedError();
        }
        else if (this.connection.driver instanceof AbstractSqliteDriver_1.AbstractSqliteDriver) {
            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                return " LIMIT -1 OFFSET " + offset;
        }
        else if (this.connection.driver instanceof OracleDriver_1.OracleDriver) {
            if (limit && offset)
                return " OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
            if (limit)
                return " FETCH NEXT " + limit + " ROWS ONLY";
            if (offset)
                return " OFFSET " + offset + " ROWS";
        }
        else {
            if (limit && offset)
                return " LIMIT " + limit + " OFFSET " + offset;
            if (limit)
                return " LIMIT " + limit;
            if (offset)
                return " OFFSET " + offset;
        }
        return "";
    };
    /**
     * Creates "LOCK" part of SQL query.
     */
    SelectQueryBuilder.prototype.createLockExpression = function () {
        var driver = this.connection.driver;
        var lockTablesClause = "";
        if (this.expressionMap.lockTables) {
            if (!(driver instanceof PostgresDriver_1.PostgresDriver)) {
                throw new Error("Lock tables not supported in selected driver");
            }
            if (this.expressionMap.lockTables.length < 1) {
                throw new Error("lockTables cannot be an empty array");
            }
            lockTablesClause = " OF " + this.expressionMap.lockTables.join(", ");
        }
        switch (this.expressionMap.lockMode) {
            case "pessimistic_read":
                if (driver instanceof MysqlDriver_1.MysqlDriver || driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver) {
                    return " LOCK IN SHARE MODE";
                }
                else if (driver instanceof PostgresDriver_1.PostgresDriver) {
                    return " FOR SHARE" + lockTablesClause;
                }
                else if (driver instanceof OracleDriver_1.OracleDriver) {
                    return " FOR UPDATE";
                }
                else if (driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    return "";
                }
                else {
                    throw new LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_write":
                if (driver instanceof MysqlDriver_1.MysqlDriver || driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver || driver instanceof OracleDriver_1.OracleDriver) {
                    return " FOR UPDATE";
                }
                else if (driver instanceof PostgresDriver_1.PostgresDriver) {
                    return " FOR UPDATE" + lockTablesClause;
                }
                else if (driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    return "";
                }
                else {
                    throw new LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_partial_write":
                if (driver instanceof PostgresDriver_1.PostgresDriver) {
                    return " FOR UPDATE" + lockTablesClause + " SKIP LOCKED";
                }
                else if (driver instanceof MysqlDriver_1.MysqlDriver) {
                    return " FOR UPDATE SKIP LOCKED";
                }
                else {
                    throw new LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError();
                }
            case "pessimistic_write_or_fail":
                if (driver instanceof PostgresDriver_1.PostgresDriver) {
                    return " FOR UPDATE" + lockTablesClause + " NOWAIT";
                }
                else if (driver instanceof MysqlDriver_1.MysqlDriver) {
                    return " FOR UPDATE NOWAIT";
                }
                else {
                    throw new LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError();
                }
            case "for_no_key_update":
                if (driver instanceof PostgresDriver_1.PostgresDriver) {
                    return " FOR NO KEY UPDATE" + lockTablesClause;
                }
                else {
                    throw new LockNotSupportedOnGivenDriverError_1.LockNotSupportedOnGivenDriverError();
                }
            default:
                return "";
        }
    };
    /**
     * Creates "HAVING" part of SQL query.
     */
    SelectQueryBuilder.prototype.createHavingExpression = function () {
        var _this = this;
        if (!this.expressionMap.havings || !this.expressionMap.havings.length)
            return "";
        var conditions = this.expressionMap.havings.map(function (having, index) {
            switch (having.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + _this.replacePropertyNames(having.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + _this.replacePropertyNames(having.condition);
                default:
                    return _this.replacePropertyNames(having.condition);
            }
        }).join(" ");
        if (!conditions.length)
            return "";
        return " HAVING " + conditions;
    };
    SelectQueryBuilder.prototype.buildEscapedEntityColumnSelects = function (aliasName, metadata) {
        var _this = this;
        var hasMainAlias = this.expressionMap.selects.some(function (select) { return select.selection === aliasName; });
        var columns = [];
        if (hasMainAlias) {
            columns.push.apply(columns, tslib_1.__spreadArray([], tslib_1.__read(metadata.columns.filter(function (column) { return column.isSelect === true; }))));
        }
        columns.push.apply(columns, tslib_1.__spreadArray([], tslib_1.__read(metadata.columns.filter(function (column) {
            return _this.expressionMap.selects.some(function (select) { return select.selection === aliasName + "." + column.propertyPath; });
        }))));
        // if user used partial selection and did not select some primary columns which are required to be selected
        // we select those primary columns and mark them as "virtual". Later virtual column values will be removed from final entity
        // to make entity contain exactly what user selected
        if (columns.length === 0) // however not in the case when nothing (even partial) was selected from this target (for example joins without selection)
            return [];
        var nonSelectedPrimaryColumns = this.expressionMap.queryEntity ? metadata.primaryColumns.filter(function (primaryColumn) { return columns.indexOf(primaryColumn) === -1; }) : [];
        var allColumns = tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(columns)), tslib_1.__read(nonSelectedPrimaryColumns));
        return allColumns.map(function (column) {
            var selection = _this.expressionMap.selects.find(function (select) { return select.selection === aliasName + "." + column.propertyPath; });
            var selectionPath = _this.escape(aliasName) + "." + _this.escape(column.databaseName);
            if (_this.connection.driver.spatialTypes.indexOf(column.type) !== -1) {
                if (_this.connection.driver instanceof MysqlDriver_1.MysqlDriver || _this.connection.driver instanceof AuroraDataApiDriver_1.AuroraDataApiDriver) {
                    var useLegacy = _this.connection.driver.options.legacySpatialSupport;
                    var asText = useLegacy ? "AsText" : "ST_AsText";
                    selectionPath = asText + "(" + selectionPath + ")";
                }
                if (_this.connection.driver instanceof PostgresDriver_1.PostgresDriver)
                    // cast to JSON to trigger parsing in the driver
                    if (column.precision) {
                        selectionPath = "ST_AsGeoJSON(" + selectionPath + ", " + column.precision + ")::json";
                    }
                    else {
                        selectionPath = "ST_AsGeoJSON(" + selectionPath + ")::json";
                    }
                if (_this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver)
                    selectionPath = selectionPath + ".ToString()";
            }
            return {
                selection: selectionPath,
                aliasName: selection && selection.aliasName ? selection.aliasName : DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, aliasName, column.databaseName),
                // todo: need to keep in mind that custom selection.aliasName breaks hydrator. fix it later!
                virtual: selection ? selection.virtual === true : (hasMainAlias ? false : true),
            };
        });
    };
    SelectQueryBuilder.prototype.findEntityColumnSelects = function (aliasName, metadata) {
        var mainSelect = this.expressionMap.selects.find(function (select) { return select.selection === aliasName; });
        if (mainSelect)
            return [mainSelect];
        return this.expressionMap.selects.filter(function (select) {
            return metadata.columns.some(function (column) { return select.selection === aliasName + "." + column.propertyPath; });
        });
    };
    SelectQueryBuilder.prototype.computeCountExpression = function () {
        var _this = this;
        var mainAlias = this.expressionMap.mainAlias.name; // todo: will this work with "fromTableName"?
        var metadata = this.expressionMap.mainAlias.metadata;
        var primaryColumns = metadata.primaryColumns;
        var distinctAlias = this.escape(mainAlias);
        // If we aren't doing anything that will create a join, we can use a simpler `COUNT` instead
        // so we prevent poor query patterns in the most likely cases
        if (this.expressionMap.joinAttributes.length === 0 &&
            this.expressionMap.relationIdAttributes.length === 0 &&
            this.expressionMap.relationCountAttributes.length === 0) {
            return "COUNT(1)";
        }
        // For everything else, we'll need to do some hackery to get the correct count values.
        if (this.connection.driver instanceof CockroachDriver_1.CockroachDriver || this.connection.driver instanceof PostgresDriver_1.PostgresDriver) {
            // Postgres and CockroachDB can pass multiple parameters to the `DISTINCT` function
            // https://www.postgresql.org/docs/9.5/sql-select.html#SQL-DISTINCT
            return "COUNT(DISTINCT(" +
                primaryColumns.map(function (c) { return distinctAlias + "." + _this.escape(c.databaseName); }).join(", ") +
                "))";
        }
        if (this.connection.driver instanceof MysqlDriver_1.MysqlDriver) {
            // MySQL & MariaDB can pass multiple parameters to the `DISTINCT` language construct
            // https://mariadb.com/kb/en/count-distinct/
            return "COUNT(DISTINCT " +
                primaryColumns.map(function (c) { return distinctAlias + "." + _this.escape(c.databaseName); }).join(", ") +
                ")";
        }
        if (this.connection.driver instanceof SqlServerDriver_1.SqlServerDriver) {
            // SQL Server has gotta be different from everyone else.  They don't support
            // distinct counting multiple columns & they don't have the same operator
            // characteristic for concatenating, so we gotta use the `CONCAT` function.
            // However, If it's exactly 1 column we can omit the `CONCAT` for better performance.
            var columnsExpression = primaryColumns.map(function (primaryColumn) { return distinctAlias + "." + _this.escape(primaryColumn.databaseName); }).join(", '|;|', ");
            if (primaryColumns.length === 1) {
                return "COUNT(DISTINCT(" + columnsExpression + "))";
            }
            return "COUNT(DISTINCT(CONCAT(" + columnsExpression + ")))";
        }
        // If all else fails, fall back to a `COUNT` and `DISTINCT` across all the primary columns concatenated.
        // Per the SQL spec, this is the canonical string concatenation mechanism which is most
        // likely to work across servers implementing the SQL standard.
        // Please note, if there is only one primary column that the concatenation does not occur in this
        // query and the query is a standard `COUNT DISTINCT` in that case.
        return "COUNT(DISTINCT(" +
            primaryColumns.map(function (c) { return distinctAlias + "." + _this.escape(c.databaseName); }).join(" || '|;|' || ") +
            "))";
    };
    SelectQueryBuilder.prototype.executeCountQuery = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var countSql, results;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        countSql = this.computeCountExpression();
                        return [4 /*yield*/, this.clone()
                                .orderBy()
                                .groupBy()
                                .offset(undefined)
                                .limit(undefined)
                                .skip(undefined)
                                .take(undefined)
                                .select(countSql, "cnt")
                                .setOption("disable-global-order")
                                .loadRawResults(queryRunner)];
                    case 1:
                        results = _a.sent();
                        if (!results || !results[0] || !results[0]["cnt"])
                            return [2 /*return*/, 0];
                        return [2 /*return*/, parseInt(results[0]["cnt"])];
                }
            });
        });
    };
    /**
     * Executes sql generated by query builder and returns object with raw results and entities created from them.
     */
    SelectQueryBuilder.prototype.executeEntitiesAndRawResults = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var metadata, relationIdLoader, relationCountLoader, relationIdMetadataTransformer, relationCountMetadataTransformer, rawResults, entities, _a, selects, orderBys_1, metadata_1, mainAliasName_1, querySelects, condition, parameters_1, alias_1, ids, areAllNumbers, rawRelationIdResults, rawRelationCountResults, transformer, broadcastResult;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.expressionMap.mainAlias)
                            throw new Error("Alias is not set. Use \"from\" method to set an alias.");
                        if ((this.expressionMap.lockMode === "pessimistic_read" || this.expressionMap.lockMode === "pessimistic_write" || this.expressionMap.lockMode === "pessimistic_partial_write" || this.expressionMap.lockMode === "pessimistic_write_or_fail" || this.expressionMap.lockMode === "for_no_key_update") && !queryRunner.isTransactionActive)
                            throw new PessimisticLockTransactionRequiredError_1.PessimisticLockTransactionRequiredError();
                        if (this.expressionMap.lockMode === "optimistic") {
                            metadata = this.expressionMap.mainAlias.metadata;
                            if (!metadata.versionColumn && !metadata.updateDateColumn)
                                throw new NoVersionOrUpdateDateColumnError_1.NoVersionOrUpdateDateColumnError(metadata.name);
                        }
                        relationIdLoader = new RelationIdLoader_1.RelationIdLoader(this.connection, queryRunner, this.expressionMap.relationIdAttributes);
                        relationCountLoader = new RelationCountLoader_1.RelationCountLoader(this.connection, queryRunner, this.expressionMap.relationCountAttributes);
                        relationIdMetadataTransformer = new RelationIdMetadataToAttributeTransformer_1.RelationIdMetadataToAttributeTransformer(this.expressionMap);
                        relationIdMetadataTransformer.transform();
                        relationCountMetadataTransformer = new RelationCountMetadataToAttributeTransformer_1.RelationCountMetadataToAttributeTransformer(this.expressionMap);
                        relationCountMetadataTransformer.transform();
                        rawResults = [], entities = [];
                        if (!((this.expressionMap.skip || this.expressionMap.take) && this.expressionMap.joinAttributes.length > 0)) return [3 /*break*/, 4];
                        _a = tslib_1.__read(this.createOrderByCombinedWithSelectExpression("distinctAlias"), 2), selects = _a[0], orderBys_1 = _a[1];
                        metadata_1 = this.expressionMap.mainAlias.metadata;
                        mainAliasName_1 = this.expressionMap.mainAlias.name;
                        querySelects = metadata_1.primaryColumns.map(function (primaryColumn) {
                            var distinctAlias = _this.escape("distinctAlias");
                            var columnAlias = _this.escape(DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, mainAliasName_1, primaryColumn.databaseName));
                            if (!orderBys_1[columnAlias]) // make sure we aren't overriding user-defined order in inverse direction
                                orderBys_1[columnAlias] = "ASC";
                            var alias = DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, "ids_" + mainAliasName_1, primaryColumn.databaseName);
                            return distinctAlias + "." + columnAlias + " as \"" + alias + "\"";
                        });
                        return [4 /*yield*/, new SelectQueryBuilder(this.connection, queryRunner)
                                .select("DISTINCT " + querySelects.join(", "))
                                .addSelect(selects)
                                .from("(" + this.clone().orderBy().getQuery() + ")", "distinctAlias")
                                .offset(this.expressionMap.skip)
                                .limit(this.expressionMap.take)
                                .orderBy(orderBys_1)
                                .cache(this.expressionMap.cache ? this.expressionMap.cache : this.expressionMap.cacheId, this.expressionMap.cacheDuration)
                                .setParameters(this.getParameters())
                                .setNativeParameters(this.expressionMap.nativeParameters)
                                .getRawMany()];
                    case 1:
                        rawResults = _b.sent();
                        if (!(rawResults.length > 0)) return [3 /*break*/, 3];
                        condition = "";
                        parameters_1 = {};
                        if (metadata_1.hasMultiplePrimaryKeys) {
                            condition = rawResults.map(function (result, index) {
                                return metadata_1.primaryColumns.map(function (primaryColumn) {
                                    var paramKey = "orm_distinct_ids_" + index + "_" + primaryColumn.databaseName;
                                    parameters_1[paramKey] = result["ids_" + mainAliasName_1 + "_" + primaryColumn.databaseName];
                                    return mainAliasName_1 + "." + primaryColumn.propertyPath + "=:" + paramKey;
                                }).join(" AND ");
                            }).join(" OR ");
                        }
                        else {
                            alias_1 = DriverUtils_1.DriverUtils.buildColumnAlias(this.connection.driver, "ids_" + mainAliasName_1, metadata_1.primaryColumns[0].databaseName);
                            ids = rawResults.map(function (result) { return result[alias_1]; });
                            areAllNumbers = ids.every(function (id) { return typeof id === "number"; });
                            if (areAllNumbers) {
                                // fixes #190. if all numbers then its safe to perform query without parameter
                                condition = mainAliasName_1 + "." + metadata_1.primaryColumns[0].propertyPath + " IN (" + ids.join(", ") + ")";
                            }
                            else {
                                parameters_1["orm_distinct_ids"] = ids;
                                condition = mainAliasName_1 + "." + metadata_1.primaryColumns[0].propertyPath + " IN (:...orm_distinct_ids)";
                            }
                        }
                        return [4 /*yield*/, this.clone()
                                .mergeExpressionMap({ extraAppendedAndWhereCondition: condition })
                                .setParameters(parameters_1)
                                .loadRawResults(queryRunner)];
                    case 2:
                        rawResults = _b.sent();
                        _b.label = 3;
                    case 3: return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.loadRawResults(queryRunner)];
                    case 5:
                        rawResults = _b.sent();
                        _b.label = 6;
                    case 6:
                        if (!(rawResults.length > 0)) return [3 /*break*/, 10];
                        return [4 /*yield*/, relationIdLoader.load(rawResults)];
                    case 7:
                        rawRelationIdResults = _b.sent();
                        return [4 /*yield*/, relationCountLoader.load(rawResults)];
                    case 8:
                        rawRelationCountResults = _b.sent();
                        transformer = new RawSqlResultsToEntityTransformer_1.RawSqlResultsToEntityTransformer(this.expressionMap, this.connection.driver, rawRelationIdResults, rawRelationCountResults, this.queryRunner);
                        entities = transformer.transform(rawResults, this.expressionMap.mainAlias);
                        if (!(this.expressionMap.callListeners === true && this.expressionMap.mainAlias.hasMetadata)) return [3 /*break*/, 10];
                        broadcastResult = new BroadcasterResult_1.BroadcasterResult();
                        queryRunner.broadcaster.broadcastLoadEventsForAll(broadcastResult, this.expressionMap.mainAlias.metadata, entities);
                        if (!(broadcastResult.promises.length > 0)) return [3 /*break*/, 10];
                        return [4 /*yield*/, Promise.all(broadcastResult.promises)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [2 /*return*/, {
                            raw: rawResults,
                            entities: entities,
                        }];
                }
            });
        });
    };
    SelectQueryBuilder.prototype.createOrderByCombinedWithSelectExpression = function (parentAlias) {
        var _this = this;
        // if table has a default order then apply it
        var orderBys = this.expressionMap.allOrderBys;
        var selectString = Object.keys(orderBys)
            .map(function (orderCriteria) {
            if (orderCriteria.indexOf(".") !== -1) {
                var criteriaParts = orderCriteria.split(".");
                var aliasName = criteriaParts[0];
                var propertyPath = criteriaParts.slice(1).join(".");
                var alias = _this.expressionMap.findAliasByName(aliasName);
                var column = alias.metadata.findColumnWithPropertyPath(propertyPath);
                return _this.escape(parentAlias) + "." + _this.escape(DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, aliasName, column.databaseName));
            }
            else {
                if (_this.expressionMap.selects.find(function (select) { return select.selection === orderCriteria || select.aliasName === orderCriteria; }))
                    return _this.escape(parentAlias) + "." + orderCriteria;
                return "";
            }
        })
            .join(", ");
        var orderByObject = {};
        Object.keys(orderBys).forEach(function (orderCriteria) {
            if (orderCriteria.indexOf(".") !== -1) {
                var criteriaParts = orderCriteria.split(".");
                var aliasName = criteriaParts[0];
                var propertyPath = criteriaParts.slice(1).join(".");
                var alias = _this.expressionMap.findAliasByName(aliasName);
                var column = alias.metadata.findColumnWithPropertyPath(propertyPath);
                orderByObject[_this.escape(parentAlias) + "." + _this.escape(DriverUtils_1.DriverUtils.buildColumnAlias(_this.connection.driver, aliasName, column.databaseName))] = orderBys[orderCriteria];
            }
            else {
                if (_this.expressionMap.selects.find(function (select) { return select.selection === orderCriteria || select.aliasName === orderCriteria; })) {
                    orderByObject[_this.escape(parentAlias) + "." + orderCriteria] = orderBys[orderCriteria];
                }
                else {
                    orderByObject[orderCriteria] = orderBys[orderCriteria];
                }
            }
        });
        return [selectString, orderByObject];
    };
    /**
     * Loads raw results from the database.
     */
    SelectQueryBuilder.prototype.loadRawResults = function (queryRunner) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, sql, parameters, queryId, cacheOptions, savedQueryResultCacheOptions, results;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = tslib_1.__read(this.getQueryAndParameters(), 2), sql = _a[0], parameters = _a[1];
                        queryId = sql + " -- PARAMETERS: " + JSON.stringify(parameters);
                        cacheOptions = typeof this.connection.options.cache === "object" ? this.connection.options.cache : {};
                        savedQueryResultCacheOptions = undefined;
                        if (!(this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled))) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.connection.queryResultCache.getFromCache({
                                identifier: this.expressionMap.cacheId,
                                query: queryId,
                                duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000
                            }, queryRunner)];
                    case 1:
                        savedQueryResultCacheOptions = _b.sent();
                        if (savedQueryResultCacheOptions && !this.connection.queryResultCache.isExpired(savedQueryResultCacheOptions))
                            return [2 /*return*/, JSON.parse(savedQueryResultCacheOptions.result)];
                        _b.label = 2;
                    case 2: return [4 /*yield*/, queryRunner.query(sql, parameters)];
                    case 3:
                        results = _b.sent();
                        if (!(this.connection.queryResultCache && (this.expressionMap.cache || cacheOptions.alwaysEnabled))) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.connection.queryResultCache.storeInCache({
                                identifier: this.expressionMap.cacheId,
                                query: queryId,
                                time: new Date().getTime(),
                                duration: this.expressionMap.cacheDuration || cacheOptions.duration || 1000,
                                result: JSON.stringify(results)
                            }, savedQueryResultCacheOptions, queryRunner)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Merges into expression map given expression map properties.
     */
    SelectQueryBuilder.prototype.mergeExpressionMap = function (expressionMap) {
        ObjectUtils_1.ObjectUtils.assign(this.expressionMap, expressionMap);
        return this;
    };
    /**
     * Normalizes a give number - converts to int if possible.
     */
    SelectQueryBuilder.prototype.normalizeNumber = function (num) {
        if (typeof num === "number" || num === undefined || num === null)
            return num;
        return Number(num);
    };
    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    SelectQueryBuilder.prototype.obtainQueryRunner = function () {
        return this.queryRunner || this.connection.createQueryRunner("slave");
    };
    return SelectQueryBuilder;
}(QueryBuilder_1.QueryBuilder));
exports.SelectQueryBuilder = SelectQueryBuilder;

//# sourceMappingURL=SelectQueryBuilder.js.map
