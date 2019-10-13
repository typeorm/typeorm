"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var QueryExpressionMap_1 = require("./QueryExpressionMap");
var Brackets_1 = require("./Brackets");
var EntityMetadata_1 = require("../metadata/EntityMetadata");
var SqljsDriver_1 = require("../driver/sqljs/SqljsDriver");
var SqlServerDriver_1 = require("../driver/sqlserver/SqlServerDriver");
var OracleDriver_1 = require("../driver/oracle/OracleDriver");
var __1 = require("../");
var FindOperator_1 = require("../find-options/FindOperator");
var In_1 = require("../find-options/operator/In");
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
        enumerable: true,
        configurable: true
    });
    /**
     * Creates SELECT query and selects given data.
     * Replaces all previous selections if they exist.
     */
    QueryBuilder.prototype.select = function (selection, selectionAliasName) {
        this.expressionMap.queryType = "select";
        if (selection instanceof Array) {
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
        var relations = relation instanceof Array ? relation : [relation];
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
            var subQuery = "";
            if (entityTarget instanceof Function) {
                var subQueryBuilder = entityTarget(this.subQuery());
                this.setParameters(subQueryBuilder.getParameters());
                subQuery = subQueryBuilder.getQuery();
            }
            else {
                subQuery = entityTarget;
            }
            var isSubQuery = entityTarget instanceof Function || entityTarget.substr(0, 1) === "(" && entityTarget.substr(-1) === ")";
            return this.expressionMap.createAlias({
                type: "from",
                name: aliasName,
                tablePath: isSubQuery === false ? entityTarget : undefined,
                subQuery: isSubQuery === true ? subQuery : undefined,
            });
        }
    };
    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    QueryBuilder.prototype.replacePropertyNames = function (statement) {
        var _this = this;
        this.expressionMap.aliases.forEach(function (alias) {
            if (!alias.hasMetadata)
                return;
            var replaceAliasNamePrefix = _this.expressionMap.aliasNamePrefixingEnabled ? alias.name + "\\." : "";
            var replacementAliasNamePrefix = _this.expressionMap.aliasNamePrefixingEnabled ? _this.escape(alias.name) + "." : "";
            alias.metadata.columns.forEach(function (column) {
                var expression = "([ =\(]|^.{0})" + replaceAliasNamePrefix + column.propertyPath + "([ =\)\,]|.{0}$)";
                statement = statement.replace(new RegExp(expression, "gm"), "$1" + replacementAliasNamePrefix + _this.escape(column.databaseName) + "$2");
                var expression2 = "([ =\(]|^.{0})" + replaceAliasNamePrefix + column.propertyName + "([ =\)\,]|.{0}$)";
                statement = statement.replace(new RegExp(expression2, "gm"), "$1" + replacementAliasNamePrefix + _this.escape(column.databaseName) + "$2");
            });
            alias.metadata.relations.forEach(function (relation) {
                tslib_1.__spread(relation.joinColumns, relation.inverseJoinColumns).forEach(function (joinColumn) {
                    var expression = "([ =\(]|^.{0})" + replaceAliasNamePrefix + relation.propertyPath + "\\." + joinColumn.referencedColumn.propertyPath + "([ =\)\,]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), "$1" + replacementAliasNamePrefix + _this.escape(joinColumn.databaseName) + "$2"); // todo: fix relation.joinColumns[0], what if multiple columns
                });
                if (relation.joinColumns.length > 0) {
                    var expression = "([ =\(]|^.{0})" + replaceAliasNamePrefix + relation.propertyPath + "([ =\)\,]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), "$1" + replacementAliasNamePrefix + _this.escape(relation.joinColumns[0].databaseName) + "$2"); // todo: fix relation.joinColumns[0], what if multiple columns
                }
            });
        });
        return statement;
    };
    /**
     * Creates "WHERE" expression.
     */
    QueryBuilder.prototype.createWhereExpression = function () {
        var conditions = this.createWhereExpressionString();
        if (this.expressionMap.mainAlias.hasMetadata) {
            var metadata = this.expressionMap.mainAlias.metadata;
            if (metadata.discriminatorColumn && metadata.parentEntityMetadata) {
                var column = this.expressionMap.aliasNamePrefixingEnabled
                    ? this.expressionMap.mainAlias.name + "." + metadata.discriminatorColumn.databaseName
                    : metadata.discriminatorColumn.databaseName;
                var condition = this.replacePropertyNames(column) + " IN (:...discriminatorColumnValues)";
                return " WHERE " + (conditions.length ? "(" + conditions + ") AND" : "") + " " + condition;
            }
        }
        if (!conditions.length) // TODO copy in to discriminator condition
            return this.expressionMap.extraAppendedAndWhereCondition ? " WHERE " + this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition) : "";
        if (this.expressionMap.extraAppendedAndWhereCondition)
            return " WHERE (" + conditions + ") AND " + this.replacePropertyNames(this.expressionMap.extraAppendedAndWhereCondition);
        return " WHERE " + conditions;
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
            columns.push.apply(columns, tslib_1.__spread(this.expressionMap.extraReturningColumns.filter(function (column) {
                return columns.indexOf(column) === -1;
            })));
        }
        if (columns.length) {
            var columnsExpression = columns.map(function (column) {
                var name = _this.escape(column.databaseName);
                if (driver instanceof SqlServerDriver_1.SqlServerDriver) {
                    if (_this.expressionMap.queryType === "insert" || _this.expressionMap.queryType === "update") {
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
        if (this.expressionMap.returning instanceof Array) {
            this.expressionMap.returning.forEach(function (columnName) {
                if (_this.expressionMap.mainAlias.hasMetadata) {
                    columns.push.apply(columns, tslib_1.__spread(_this.expressionMap.mainAlias.metadata.findColumnsWithPropertyPath(columnName)));
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
        var _this = this;
        var _a;
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
            where.whereFactory(whereQueryBuilder);
            var whereString = whereQueryBuilder.createWhereExpressionString();
            this.setParameters(whereQueryBuilder.getParameters());
            return whereString ? "(" + whereString + ")" : "";
        }
        else if (where instanceof Function) {
            return where(this);
        }
        else if (where instanceof Object) {
            var wheres = where instanceof Array ? where : [where];
            var andConditions = void 0;
            var parameterIndex_1 = Object.keys(this.expressionMap.nativeParameters).length;
            if (this.expressionMap.mainAlias.hasMetadata) {
                andConditions = wheres.map(function (where, whereIndex) {
                    var propertyPaths = EntityMetadata_1.EntityMetadata.createPropertyPath(_this.expressionMap.mainAlias.metadata, where);
                    return propertyPaths.map(function (propertyPath, propertyIndex) {
                        var columns = _this.expressionMap.mainAlias.metadata.findColumnsWithPropertyPath(propertyPath);
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
                                    var realParameterValues = parameterValue.multipleParameters ? parameterValue.value : [parameterValue.value];
                                    realParameterValues.forEach(function (realParameterValue, realParameterValueIndex) {
                                        _this.expressionMap.nativeParameters[parameterName + (parameterBaseCount + realParameterValueIndex)] = realParameterValue;
                                        parameterIndex_1++;
                                        parameters_1.push(_this.connection.driver.createParameter(parameterName + (parameterBaseCount + realParameterValueIndex), parameterIndex_1 - 1));
                                    });
                                }
                                return parameterValue.toSql(_this.connection, aliasPath, parameters_1);
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
     * Creates a query builder used to execute sql queries inside this query builder.
     */
    QueryBuilder.prototype.obtainQueryRunner = function () {
        return this.queryRunner || this.connection.createQueryRunner("master");
    };
    return QueryBuilder;
}());
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=QueryBuilder.js.map