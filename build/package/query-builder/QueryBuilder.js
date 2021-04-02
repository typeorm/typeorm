"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
var tslib_1 = require("tslib");
var QueryExpressionMap_1 = require("./QueryExpressionMap");
var Brackets_1 = require("./Brackets");
var EntityMetadata_1 = require("../metadata/EntityMetadata");
var SqljsDriver_1 = require("../driver/sqljs/SqljsDriver");
var PostgresDriver_1 = require("../driver/postgres/PostgresDriver");
var CockroachDriver_1 = require("../driver/cockroachdb/CockroachDriver");
var SqlServerDriver_1 = require("../driver/sqlserver/SqlServerDriver");
var OracleDriver_1 = require("../driver/oracle/OracleDriver");
var __1 = require("../");
var FindOperator_1 = require("../find-options/FindOperator");
var In_1 = require("../find-options/operator/In");
var EntityColumnNotFound_1 = require("../error/EntityColumnNotFound");
// todo: completely cover query builder with tests
// todo: entityOrProperty can be target name. implement proper behaviour if it is.
// todo: check in persistment if id exist on object and throw exception (can be in partial selection?)
// todo: fix problem with long aliases eg getMaxIdentifierLength
// todo: fix replacing in .select("COUNT(post.id) AS cnt") statement
// todo: implement joinAlways in relations and relationId
// todo: finish partial selection
// todo: sugar methods like: .addCount and .selectCount, selectCountAndMap, selectSum, selectSumAndMap, ...
// todo: implement @Select decorator
// todo: add select and map functions
// todo: implement relation/entity loading and setting them into properties within a separate query
// .loadAndMap("post.categories", "post.categories", qb => ...)
// .loadAndMap("post.categories", Category, qb => ...)
/**
 * Allows to build complex sql queries in a fashion way and execute those queries.
 */
var QueryBuilder = /** @class */ (function () {
    /**
     * QueryBuilder can be initialized from given Connection and QueryRunner objects or from given other QueryBuilder.
     */
    function QueryBuilder(connectionOrQueryBuilder, queryRunner) {
        if (connectionOrQueryBuilder instanceof QueryBuilder) {
            this.connection = connectionOrQueryBuilder.connection;
            this.queryRunner = connectionOrQueryBuilder.queryRunner;
            this.expressionMap = connectionOrQueryBuilder.expressionMap.clone();
        }
        else {
            this.connection = connectionOrQueryBuilder;
            this.queryRunner = queryRunner;
            this.expressionMap = new QueryExpressionMap_1.QueryExpressionMap(this.connection);
        }
    }
    Object.defineProperty(QueryBuilder.prototype, "alias", {
        // -------------------------------------------------------------------------
        // Accessors
        // -------------------------------------------------------------------------
        /**
         * Gets the main alias string used in this query builder.
         */
        get: function () {
            if (!this.expressionMap.mainAlias)
                throw new Error("Main alias is not set"); // todo: better exception
            return this.expressionMap.mainAlias.name;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    QueryBuilder.prototype.select = function (selection, selectionAliasName) {
        this.expressionMap.queryType = "select";
        if (Array.isArray(selection)) {
            this.expressionMap.selects = selection.map(function (selection) { return ({ selection: selection }); });
        }
        else if (selection) {
            this.expressionMap.selects = [{ selection: selection, aliasName: selectionAliasName }];
        }
        // loading it dynamically because of circular issue
        var SelectQueryBuilderCls = require("./SelectQueryBuilder").SelectQueryBuilder;
        if (this instanceof SelectQueryBuilderCls)
            return this;
        return new SelectQueryBuilderCls(this);
    };
    /**
     * Creates INSERT query.
     */
    QueryBuilder.prototype.insert = function () {
        this.expressionMap.queryType = "insert";
        // loading it dynamically because of circular issue
        var InsertQueryBuilderCls = require("./InsertQueryBuilder").InsertQueryBuilder;
        if (this instanceof InsertQueryBuilderCls)
            return this;
        return new InsertQueryBuilderCls(this);
    };
    /**
     * Creates UPDATE query and applies given update values.
     */
    QueryBuilder.prototype.update = function (entityOrTableNameUpdateSet, maybeUpdateSet) {
        var updateSet = maybeUpdateSet ? maybeUpdateSet : entityOrTableNameUpdateSet;
        entityOrTableNameUpdateSet = entityOrTableNameUpdateSet instanceof __1.EntitySchema ? entityOrTableNameUpdateSet.options.name : entityOrTableNameUpdateSet;
        if (entityOrTableNameUpdateSet instanceof Function || typeof entityOrTableNameUpdateSet === "string") {
            var mainAlias = this.createFromAlias(entityOrTableNameUpdateSet);
            this.expressionMap.setMainAlias(mainAlias);
        }
        this.expressionMap.queryType = "update";
        this.expressionMap.valuesSet = updateSet;
        // loading it dynamically because of circular issue
        var UpdateQueryBuilderCls = require("./UpdateQueryBuilder").UpdateQueryBuilder;
        if (this instanceof UpdateQueryBuilderCls)
            return this;
        return new UpdateQueryBuilderCls(this);
    };
    /**
     * Creates DELETE query.
     */
    QueryBuilder.prototype.delete = function () {
        this.expressionMap.queryType = "delete";
        // loading it dynamically because of circular issue
        var DeleteQueryBuilderCls = require("./DeleteQueryBuilder").DeleteQueryBuilder;
        if (this instanceof DeleteQueryBuilderCls)
            return this;
        return new DeleteQueryBuilderCls(this);
    };
    QueryBuilder.prototype.softDelete = function () {
        this.expressionMap.queryType = "soft-delete";
        // loading it dynamically because of circular issue
        var SoftDeleteQueryBuilderCls = require("./SoftDeleteQueryBuilder").SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this;
        return new SoftDeleteQueryBuilderCls(this);
    };
    QueryBuilder.prototype.restore = function () {
        this.expressionMap.queryType = "restore";
        // loading it dynamically because of circular issue
        var SoftDeleteQueryBuilderCls = require("./SoftDeleteQueryBuilder").SoftDeleteQueryBuilder;
        if (this instanceof SoftDeleteQueryBuilderCls)
            return this;
        return new SoftDeleteQueryBuilderCls(this);
    };
    /**
     * Sets entity's relation with which this query builder gonna work.
     */
    QueryBuilder.prototype.relation = function (entityTargetOrPropertyPath, maybePropertyPath) {
        var entityTarget = arguments.length === 2 ? entityTargetOrPropertyPath : undefined;
        var propertyPath = arguments.length === 2 ? maybePropertyPath : entityTargetOrPropertyPath;
        this.expressionMap.queryType = "relation";
        this.expressionMap.relationPropertyPath = propertyPath;
        if (entityTarget) {
            var mainAlias = this.createFromAlias(entityTarget);
            this.expressionMap.setMainAlias(mainAlias);
        }
        // loading it dynamically because of circular issue
        var RelationQueryBuilderCls = require("./RelationQueryBuilder").RelationQueryBuilder;
        if (this instanceof RelationQueryBuilderCls)
            return this;
        return new RelationQueryBuilderCls(this);
    };
    /**
     * Checks if given relation or relations exist in the entity.
     * Returns true if relation exists, false otherwise.
     *
     * todo: move this method to manager? or create a shortcut?
     */
    QueryBuilder.prototype.hasRelation = function (target, relation) {
        var entityMetadata = this.connection.getMetadata(target);
        var relations = Array.isArray(relation) ? relation : [relation];
        return relations.every(function (relation) {
            return !!entityMetadata.findRelationWithPropertyPath(relation);
        });
    };
    /**
     * Sets parameter name and its value.
     */
    QueryBuilder.prototype.setParameter = function (key, value) {
        this.expressionMap.parameters[key] = value;
        return this;
    };
    /**
     * Adds all parameters from the given object.
     */
    QueryBuilder.prototype.setParameters = function (parameters) {
        var _this = this;
        // remove function parameters
        Object.keys(parameters).forEach(function (key) {
            if (parameters[key] instanceof Function) {
                throw new Error("Function parameter isn't supported in the parameters. Please check \"" + key + "\" parameter.");
            }
        });
        // set parent query builder parameters as well in sub-query mode
        if (this.expressionMap.parentQueryBuilder)
            this.expressionMap.parentQueryBuilder.setParameters(parameters);
        Object.keys(parameters).forEach(function (key) { return _this.setParameter(key, parameters[key]); });
        return this;
    };
    /**
     * Adds native parameters from the given object.
     */
    QueryBuilder.prototype.setNativeParameters = function (parameters) {
        var _this = this;
        // set parent query builder parameters as well in sub-query mode
        if (this.expressionMap.parentQueryBuilder)
            this.expressionMap.parentQueryBuilder.setNativeParameters(parameters);
        Object.keys(parameters).forEach(function (key) {
            _this.expressionMap.nativeParameters[key] = parameters[key];
        });
        return this;
    };
    /**
     * Gets all parameters.
     */
    QueryBuilder.prototype.getParameters = function () {
        var parameters = Object.assign({}, this.expressionMap.parameters);
        // add discriminator column parameter if it exist
        if (this.expressionMap.mainAlias && this.expressionMap.mainAlias.hasMetadata) {
            var metadata = this.expressionMap.mainAlias.metadata;
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                var values = metadata.childEntityMetadatas
                    .filter(function (childMetadata) { return childMetadata.discriminatorColumn; })
                    .map(function (childMetadata) { return childMetadata.discriminatorValue; });
                values.push(metadata.discriminatorValue);
                parameters["discriminatorColumnValues"] = values;
            }
        }
        return parameters;
    };
    /**
     * Prints sql to stdout using console.log.
     */
    QueryBuilder.prototype.printSql = function () {
        var _a = tslib_1.__read(this.getQueryAndParameters(), 2), query = _a[0], parameters = _a[1];
        this.connection.logger.logQuery(query, parameters);
        return this;
    };
    /**
     * Gets generated sql that will be executed.
     * Parameters in the query are escaped for the currently used driver.
     */
    QueryBuilder.prototype.getSql = function () {
        return this.getQueryAndParameters()[0];
    };
    /**
     * Gets query to be executed with all parameters used in it.
     */
    QueryBuilder.prototype.getQueryAndParameters = function () {
        // this execution order is important because getQuery method generates this.expressionMap.nativeParameters values
        var query = this.getQuery();
        var parameters = this.getParameters();
        return this.connection.driver.escapeQueryWithParameters(query, parameters, this.expressionMap.nativeParameters);
    };
    /**
     * Executes sql generated by query builder and returns raw database results.
     */
    QueryBuilder.prototype.execute = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, sql, parameters, queryRunner;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = tslib_1.__read(this.getQueryAndParameters(), 2), sql = _a[0], parameters = _a[1];
                        queryRunner = this.obtainQueryRunner();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, , 3, 8]);
                        return [4 /*yield*/, queryRunner.query(sql, parameters)];
                    case 2: return [2 /*return*/, _b.sent()]; // await is needed here because we are using finally
                    case 3:
                        if (!(queryRunner !== this.queryRunner)) return [3 /*break*/, 5];
                        return [4 /*yield*/, queryRunner.release()];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5:
                        if (!(this.connection.driver instanceof SqljsDriver_1.SqljsDriver)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.connection.driver.autoSave()];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7: return [7 /*endfinally*/];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Creates a completely new query builder.
     * Uses same query runner as current QueryBuilder.
     */
    QueryBuilder.prototype.createQueryBuilder = function () {
        return new this.constructor(this.connection, this.queryRunner);
    };
    /**
     * Clones query builder as it is.
     * Note: it uses new query runner, if you want query builder that uses exactly same query runner,
     * you can create query builder using its constructor, for example new SelectQueryBuilder(queryBuilder)
     * where queryBuilder is cloned QueryBuilder.
     */
    QueryBuilder.prototype.clone = function () {
        return new this.constructor(this);
    };
    /**
     * Includes a Query comment in the query builder.  This is helpful for debugging purposes,
     * such as finding a specific query in the database server's logs, or for categorization using
     * an APM product.
     */
    QueryBuilder.prototype.comment = function (comment) {
        this.expressionMap.comment = comment;
        return this;
    };
    /**
     * Disables escaping.
     */
    QueryBuilder.prototype.disableEscaping = function () {
        this.expressionMap.disableEscaping = false;
        return this;
    };
    /**
     * Escapes table name, column name or alias name using current database's escaping character.
     */
    QueryBuilder.prototype.escape = function (name) {
        if (!this.expressionMap.disableEscaping)
            return name;
        return this.connection.driver.escape(name);
    };
    /**
     * Sets or overrides query builder's QueryRunner.
     */
    QueryBuilder.prototype.setQueryRunner = function (queryRunner) {
        this.queryRunner = queryRunner;
        return this;
    };
    /**
     * Indicates if listeners and subscribers must be called before and after query execution.
     * Enabled by default.
     */
    QueryBuilder.prototype.callListeners = function (enabled) {
        this.expressionMap.callListeners = enabled;
        return this;
    };
    /**
     * If set to true the query will be wrapped into a transaction.
     */
    QueryBuilder.prototype.useTransaction = function (enabled) {
        this.expressionMap.useTransaction = enabled;
        return this;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Gets escaped table name with schema name if SqlServer driver used with custom
     * schema name, otherwise returns escaped table name.
     */
    QueryBuilder.prototype.getTableName = function (tablePath) {
        var _this = this;
        return tablePath.split(".")
            .map(function (i) {
            // this condition need because in SQL Server driver when custom database name was specified and schema name was not, we got `dbName..tableName` string, and doesn't need to escape middle empty string
            if (i === "")
                return i;
            return _this.escape(i);
        }).join(".");
    };
    /**
     * Gets name of the table where insert should be performed.
     */
    QueryBuilder.prototype.getMainTableName = function () {
        if (!this.expressionMap.mainAlias)
            throw new Error("Entity where values should be inserted is not specified. Call \"qb.into(entity)\" method to specify it.");
        if (this.expressionMap.mainAlias.hasMetadata)
            return this.expressionMap.mainAlias.metadata.tablePath;
        return this.expressionMap.mainAlias.tablePath;
    };
    /**
     * Specifies FROM which entity's table select/update/delete will be executed.
     * Also sets a main string alias of the selection data.
     */
    QueryBuilder.prototype.createFromAlias = function (entityTarget, aliasName) {
        // if table has a metadata then find it to properly escape its properties
        // const metadata = this.connection.entityMetadatas.find(metadata => metadata.tableName === tableName);
        if (this.connection.hasMetadata(entityTarget)) {
            var metadata = this.connection.getMetadata(entityTarget);
            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                metadata: this.connection.getMetadata(entityTarget),
                tablePath: metadata.tablePath
            });
        }
        else {
            if (typeof entityTarget === "string") {
                var isSubquery = entityTarget.substr(0, 1) === "(" && entityTarget.substr(-1) === ")";
                return this.expressionMap.createAlias({
                    type: "from",
                    name: aliasName,
                    tablePath: !isSubquery ? entityTarget : undefined,
                    subQuery: isSubquery ? entityTarget : undefined,
                });
            }
            var subQueryBuilder = entityTarget(this.subQuery());
            this.setParameters(subQueryBuilder.getParameters());
            var subquery = subQueryBuilder.getQuery();
            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                subQuery: subquery
            });
        }
    };
    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    QueryBuilder.prototype.replacePropertyNames = function (statement) {
        var e_1, _a;
        var _this = this;
        // Escape special characters in regular expressions
        // Per https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
        var escapeRegExp = function (s) { return s.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&"); };
        var _loop_1 = function (alias) {
            var e_2, _d, e_3, _e, e_4, _f, e_5, _g, e_6, _h, e_7, _j;
            if (!alias.hasMetadata)
                return "continue";
            var replaceAliasNamePrefix = this_1.expressionMap.aliasNamePrefixingEnabled ? alias.name + "." : "";
            var replacementAliasNamePrefix = this_1.expressionMap.aliasNamePrefixingEnabled ? this_1.escape(alias.name) + "." : "";
            var replacements = {};
            try {
                // Insert & overwrite the replacements from least to most relevant in our replacements object.
                // To do this we iterate and overwrite in the order of relevance.
                // Least to Most Relevant:
                // * Relation Property Path to first join column key
                // * Relation Property Path + Column Path
                // * Column Database Name
                // * Column Propety Name
                // * Column Property Path
                for (var _k = (e_2 = void 0, tslib_1.__values(alias.metadata.relations)), _l = _k.next(); !_l.done; _l = _k.next()) {
                    var relation = _l.value;
                    if (relation.joinColumns.length > 0)
                        replacements[relation.propertyPath] = relation.joinColumns[0].databaseName;
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_l && !_l.done && (_d = _k.return)) _d.call(_k);
                }
                finally { if (e_2) throw e_2.error; }
            }
            try {
                for (var _m = (e_3 = void 0, tslib_1.__values(alias.metadata.relations)), _o = _m.next(); !_o.done; _o = _m.next()) {
                    var relation = _o.value;
                    try {
                        for (var _p = (e_4 = void 0, tslib_1.__values(tslib_1.__spreadArray(tslib_1.__spreadArray([], tslib_1.__read(relation.joinColumns)), tslib_1.__read(relation.inverseJoinColumns)))), _q = _p.next(); !_q.done; _q = _p.next()) {
                            var joinColumn = _q.value;
                            var propertyKey = relation.propertyPath + "." + joinColumn.referencedColumn.propertyPath;
                            replacements[propertyKey] = joinColumn.databaseName;
                        }
                    }
                    catch (e_4_1) { e_4 = { error: e_4_1 }; }
                    finally {
                        try {
                            if (_q && !_q.done && (_f = _p.return)) _f.call(_p);
                        }
                        finally { if (e_4) throw e_4.error; }
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_o && !_o.done && (_e = _m.return)) _e.call(_m);
                }
                finally { if (e_3) throw e_3.error; }
            }
            try {
                for (var _r = (e_5 = void 0, tslib_1.__values(alias.metadata.columns)), _s = _r.next(); !_s.done; _s = _r.next()) {
                    var column = _s.value;
                    replacements[column.databaseName] = column.databaseName;
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_s && !_s.done && (_g = _r.return)) _g.call(_r);
                }
                finally { if (e_5) throw e_5.error; }
            }
            try {
                for (var _t = (e_6 = void 0, tslib_1.__values(alias.metadata.columns)), _u = _t.next(); !_u.done; _u = _t.next()) {
                    var column = _u.value;
                    replacements[column.propertyName] = column.databaseName;
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_u && !_u.done && (_h = _t.return)) _h.call(_t);
                }
                finally { if (e_6) throw e_6.error; }
            }
            try {
                for (var _v = (e_7 = void 0, tslib_1.__values(alias.metadata.columns)), _w = _v.next(); !_w.done; _w = _v.next()) {
                    var column = _w.value;
                    replacements[column.propertyPath] = column.databaseName;
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (_w && !_w.done && (_j = _v.return)) _j.call(_v);
                }
                finally { if (e_7) throw e_7.error; }
            }
            var replacementKeys = Object.keys(replacements);
            if (replacementKeys.length) {
                statement = statement.replace(new RegExp(
                // Avoid a lookbehind here since it's not well supported
                "([ =(]|^.{0})" +
                    (escapeRegExp(replaceAliasNamePrefix) + "(" + replacementKeys.map(escapeRegExp).join("|") + ")") +
                    "(?=[ =),]|.{0}$)", "gm"), function (_, pre, p) {
                    return "" + pre + replacementAliasNamePrefix + _this.escape(replacements[p]);
                });
            }
        };
        var this_1 = this;
        try {
            for (var _b = tslib_1.__values(this.expressionMap.aliases), _c = _b.next(); !_c.done; _c = _b.next()) {
                var alias = _c.value;
                _loop_1(alias);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return statement;
    };
    QueryBuilder.prototype.createComment = function () {
        if (!this.expressionMap.comment) {
            return "";
        }
        // ANSI SQL 2003 support C style comments - comments that start with `/*` and end with `*/`
        // In some dialects query nesting is available - but not all.  Because of this, we'll need
        // to scrub "ending" characters from the SQL but otherwise we can leave everything else
        // as-is and it should be valid.
        return "/* " + this.expressionMap.comment.replace("*/", "") + " */ ";
    };
    /**
     * Creates "WHERE" expression.
     */
    QueryBuilder.prototype.createWhereExpression = function () {
        var conditionsArray = [];
        var whereExpression = this.createWhereExpressionString();
        whereExpression.trim() && conditionsArray.push(this.createWhereExpressionString());
        if (this.expressionMap.mainAlias.hasMetadata) {
            var metadata = this.expressionMap.mainAlias.metadata;
            // Adds the global condition of "non-deleted" for the entity with delete date columns in select query.
            if (this.expressionMap.queryType === "select" && !this.expressionMap.withDeleted && metadata.deleteDateColumn) {
                var column = this.expressionMap.aliasNamePrefixingEnabled
                    ? this.expressionMap.mainAlias.name + "." + metadata.deleteDateColumn.propertyName
                    : metadata.deleteDateColumn.propertyName;
                var condition = this.replacePropertyNames(column) + " IS NULL";
                conditionsArray.push(condition);
            }
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                var column = this.expressionMap.aliasNamePrefixingEnabled
                    ? this.expressionMap.mainAlias.name + "." + metadata.discriminatorColumn.databaseName
                    : metadata.discriminatorColumn.databaseName;
                var condition = this.replacePropertyNames(column) + " IN (:...discriminatorColumnValues)";
                conditionsArray.push(condition);
            }
        }
        if (this.expressionMap.extraAppendedAndWhereCondition) {
            var condition = this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition);
            conditionsArray.push(condition);
        }
        if (!conditionsArray.length) {
            return "";
        }
        else if (conditionsArray.length === 1) {
            return " WHERE " + conditionsArray[0];
        }
        else {
            return " WHERE ( " + conditionsArray.join(" ) AND ( ") + " )";
        }
    };
    /**
     * Creates "RETURNING" / "OUTPUT" expression.
     */
    QueryBuilder.prototype.createReturningExpression = function () {
        var _this = this;
        var columns = this.getReturningColumns();
        var driver = this.connection.driver;
        // also add columns we must auto-return to perform entity updation
        // if user gave his own returning
        if (typeof this.expressionMap.returning !== "string" &&
            this.expressionMap.extraReturningColumns.length > 0 &&
            driver.isReturningSqlSupported()) {
            columns.push.apply(columns, tslib_1.__spreadArray([], tslib_1.__read(this.expressionMap.extraReturningColumns.filter(function (column) {
                return columns.indexOf(column) === -1;
            }))));
        }
        if (columns.length) {
            var columnsExpression = columns.map(function (column) {
                var name = _this.escape(column.databaseName);
                if (driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    if (_this.expressionMap.queryType === "insert" || _this.expressionMap.queryType === "update" || _this.expressionMap.queryType === "soft-delete" || _this.expressionMap.queryType === "restore") {
                        return "INSERTED." + name;
                    }
                    else {
                        return _this.escape(_this.getMainTableName()) + "." + name;
                    }
                }
                else {
                    return name;
                }
            }).join(", ");
            if (driver instanceof OracleDriver_1.OracleDriver) {
                columnsExpression += " INTO " + columns.map(function (column) {
                    var parameterName = "output_" + column.databaseName;
                    _this.expressionMap.nativeParameters[parameterName] = { type: driver.columnTypeToNativeParameter(column.type), dir: driver.oracle.BIND_OUT };
                    return _this.connection.driver.createParameter(parameterName, Object.keys(_this.expressionMap.nativeParameters).length);
                }).join(", ");
            }
            if (driver instanceof SqlServerDriver_1.SqlServerDriver) {
                if (this.expressionMap.queryType === "insert" || this.expressionMap.queryType === "update") {
                    columnsExpression += " INTO @OutputTable";
                }
            }
            return columnsExpression;
        }
        else if (typeof this.expressionMap.returning === "string") {
            return this.expressionMap.returning;
        }
        return "";
    };
    /**
     * If returning / output cause is set to array of column names,
     * then this method will return all column metadatas of those column names.
     */
    QueryBuilder.prototype.getReturningColumns = function () {
        var _this = this;
        var columns = [];
        if (Array.isArray(this.expressionMap.returning)) {
            this.expressionMap.returning.forEach(function (columnName) {
                if (_this.expressionMap.mainAlias.hasMetadata) {
                    columns.push.apply(columns, tslib_1.__spreadArray([], tslib_1.__read(_this.expressionMap.mainAlias.metadata.findColumnsWithPropertyPath(columnName))));
                }
            });
        }
        return columns;
    };
    /**
     * Concatenates all added where expressions into one string.
     */
    QueryBuilder.prototype.createWhereExpressionString = function () {
        var _this = this;
        return this.expressionMap.wheres.map(function (where, index) {
            switch (where.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + _this.replacePropertyNames(where.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + _this.replacePropertyNames(where.condition);
                default:
                    return _this.replacePropertyNames(where.condition);
            }
        }).join(" ");
    };
    /**
     * Creates "WHERE" expression and variables for the given "ids".
     */
    QueryBuilder.prototype.createWhereIdsExpression = function (ids) {
        var _a;
        var _this = this;
        var metadata = this.expressionMap.mainAlias.metadata;
        var normalized = (Array.isArray(ids) ? ids : [ids]).map(function (id) { return metadata.ensureEntityIdMap(id); });
        // using in(...ids) for single primary key entities
        if (!metadata.hasMultiplePrimaryKeys
            && metadata.embeddeds.length === 0) {
            var primaryColumn_1 = metadata.primaryColumns[0];
            // getEntityValue will try to transform `In`, it is a bug
            // todo: remove this transformer check after #2390 is fixed
            if (!primaryColumn_1.transformer) {
                return this.computeWhereParameter((_a = {},
                    _a[primaryColumn_1.propertyName] = In_1.In(normalized.map(function (id) { return primaryColumn_1.getEntityValue(id, false); })),
                    _a));
            }
        }
        // create shortcuts for better readability
        var alias = this.expressionMap.aliasNamePrefixingEnabled ? this.escape(this.expressionMap.mainAlias.name) + "." : "";
        var parameterIndex = Object.keys(this.expressionMap.nativeParameters).length;
        var whereStrings = normalized.map(function (id, index) {
            var whereSubStrings = [];
            metadata.primaryColumns.forEach(function (primaryColumn, secondIndex) {
                var parameterName = "id_" + index + "_" + secondIndex;
                // whereSubStrings.push(alias + this.escape(primaryColumn.databaseName) + "=:id_" + index + "_" + secondIndex);
                whereSubStrings.push(alias + _this.escape(primaryColumn.databaseName) + " = " + _this.connection.driver.createParameter(parameterName, parameterIndex));
                _this.expressionMap.nativeParameters[parameterName] = primaryColumn.getEntityValue(id, true);
                parameterIndex++;
            });
            return whereSubStrings.join(" AND ");
        });
        return whereStrings.length > 1
            ? "(" + whereStrings.map(function (whereString) { return "(" + whereString + ")"; }).join(" OR ") + ")"
            : whereStrings[0];
    };
    /**
     * Computes given where argument - transforms to a where string all forms it can take.
     */
    QueryBuilder.prototype.computeWhereParameter = function (where) {
        var _this = this;
        if (typeof where === "string")
            return where;
        if (where instanceof Brackets_1.Brackets) {
            var whereQueryBuilder = this.createQueryBuilder();
            whereQueryBuilder.expressionMap.mainAlias = this.expressionMap.mainAlias;
            whereQueryBuilder.expressionMap.aliasNamePrefixingEnabled = this.expressionMap.aliasNamePrefixingEnabled;
            whereQueryBuilder.expressionMap.nativeParameters = this.expressionMap.nativeParameters;
            where.whereFactory(whereQueryBuilder);
            var whereString = whereQueryBuilder.createWhereExpressionString();
            this.setParameters(whereQueryBuilder.getParameters());
            return whereString ? "(" + whereString + ")" : "";
        }
        else if (where instanceof Function) {
            return where(this);
        }
        else if (where instanceof Object) {
            var wheres = Array.isArray(where) ? where : [where];
            var andConditions = void 0;
            var parameterIndex_1 = Object.keys(this.expressionMap.nativeParameters).length;
            if (this.expressionMap.mainAlias.hasMetadata) {
                andConditions = wheres.map(function (where, whereIndex) {
                    var propertyPaths = EntityMetadata_1.EntityMetadata.createPropertyPath(_this.expressionMap.mainAlias.metadata, where);
                    return propertyPaths.map(function (propertyPath, propertyIndex) {
                        var columns = _this.expressionMap.mainAlias.metadata.findColumnsWithPropertyPath(propertyPath);
                        if (!columns.length) {
                            throw new EntityColumnNotFound_1.EntityColumnNotFound(propertyPath);
                        }
                        return columns.map(function (column, columnIndex) {
                            var aliasPath = _this.expressionMap.aliasNamePrefixingEnabled ? _this.alias + "." + propertyPath : column.propertyPath;
                            var parameterValue = column.getEntityValue(where, true);
                            var parameterName = "where_" + whereIndex + "_" + propertyIndex + "_" + columnIndex;
                            var parameterBaseCount = Object.keys(_this.expressionMap.nativeParameters).filter(function (x) { return x.startsWith(parameterName); }).length;
                            if (parameterValue === null) {
                                return aliasPath + " IS NULL";
                            }
                            else if (parameterValue instanceof FindOperator_1.FindOperator) {
                                var parameters_1 = [];
                                if (parameterValue.useParameter) {
                                    if (parameterValue.objectLiteralParameters) {
                                        _this.setParameters(parameterValue.objectLiteralParameters);
                                    }
                                    else {
                                        var realParameterValues = parameterValue.multipleParameters ? parameterValue.value : [parameterValue.value];
                                        realParameterValues.forEach(function (realParameterValue, realParameterValueIndex) {
                                            _this.expressionMap.nativeParameters[parameterName + (parameterBaseCount + realParameterValueIndex)] = realParameterValue;
                                            parameterIndex_1++;
                                            parameters_1.push(_this.connection.driver.createParameter(parameterName + (parameterBaseCount + realParameterValueIndex), parameterIndex_1 - 1));
                                        });
                                    }
                                }
                                return _this.computeFindOperatorExpression(parameterValue, aliasPath, parameters_1);
                            }
                            else {
                                _this.expressionMap.nativeParameters[parameterName] = parameterValue;
                                parameterIndex_1++;
                                var parameter = _this.connection.driver.createParameter(parameterName, parameterIndex_1 - 1);
                                return aliasPath + " = " + parameter;
                            }
                        }).filter(function (expression) { return !!expression; }).join(" AND ");
                    }).filter(function (expression) { return !!expression; }).join(" AND ");
                });
            }
            else {
                andConditions = wheres.map(function (where, whereIndex) {
                    return Object.keys(where).map(function (key, parameterIndex) {
                        var parameterValue = where[key];
                        var aliasPath = _this.expressionMap.aliasNamePrefixingEnabled ? _this.alias + "." + key : key;
                        if (parameterValue === null) {
                            return aliasPath + " IS NULL";
                        }
                        else {
                            var parameterName = "where_" + whereIndex + "_" + parameterIndex;
                            _this.expressionMap.nativeParameters[parameterName] = parameterValue;
                            parameterIndex++;
                            return aliasPath + " = " + _this.connection.driver.createParameter(parameterName, parameterIndex - 1);
                        }
                    }).join(" AND ");
                });
            }
            if (andConditions.length > 1)
                return andConditions.map(function (where) { return "(" + where + ")"; }).join(" OR ");
            return andConditions.join("");
        }
        return "";
    };
    /**
     * Gets SQL needs to be inserted into final query.
     */
    QueryBuilder.prototype.computeFindOperatorExpression = function (operator, aliasPath, parameters) {
        var driver = this.connection.driver;
        switch (operator.type) {
            case "not":
                if (operator.child) {
                    return "NOT(" + this.computeFindOperatorExpression(operator.child, aliasPath, parameters) + ")";
                }
                else {
                    return aliasPath + " != " + parameters[0];
                }
            case "lessThan":
                return aliasPath + " < " + parameters[0];
            case "lessThanOrEqual":
                return aliasPath + " <= " + parameters[0];
            case "moreThan":
                return aliasPath + " > " + parameters[0];
            case "moreThanOrEqual":
                return aliasPath + " >= " + parameters[0];
            case "equal":
                return aliasPath + " = " + parameters[0];
            case "ilike":
                if (driver instanceof PostgresDriver_1.PostgresDriver || driver instanceof CockroachDriver_1.CockroachDriver) {
                    return aliasPath + " ILIKE " + parameters[0];
                }
                return "UPPER(" + aliasPath + ") LIKE UPPER(" + parameters[0] + ")";
            case "like":
                return aliasPath + " LIKE " + parameters[0];
            case "between":
                return aliasPath + " BETWEEN " + parameters[0] + " AND " + parameters[1];
            case "in":
                if (parameters.length === 0) {
                    return "0=1";
                }
                return aliasPath + " IN (" + parameters.join(", ") + ")";
            case "any":
                return aliasPath + " = ANY(" + parameters[0] + ")";
            case "isNull":
                return aliasPath + " IS NULL";
            case "raw":
                if (operator.getSql) {
                    return operator.getSql(aliasPath);
                }
                else {
                    return aliasPath + " = " + operator.value;
                }
        }
        throw new TypeError("Unsupported FindOperator " + FindOperator_1.FindOperator.constructor.name);
    };
    /**
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    QueryBuilder.prototype.obtainQueryRunner = function () {
        return this.queryRunner || this.connection.createQueryRunner();
    };
    return QueryBuilder;
}());
exports.QueryBuilder = QueryBuilder;

//# sourceMappingURL=QueryBuilder.js.map
