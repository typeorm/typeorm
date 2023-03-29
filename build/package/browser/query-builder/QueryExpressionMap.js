import { __assign, __read } from "tslib";
import { Alias } from "./Alias";
import { JoinAttribute } from "./JoinAttribute";
import { RelationIdAttribute } from "./relation-id/RelationIdAttribute";
import { RelationCountAttribute } from "./relation-count/RelationCountAttribute";
/**
 * Contains all properties of the QueryBuilder that needs to be build a final query.
 */
var QueryExpressionMap = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function QueryExpressionMap(connection) {
        this.connection = connection;
        // -------------------------------------------------------------------------
        // Public Properties
        // -------------------------------------------------------------------------
        /**
         * Indicates if QueryBuilder used to select entities and not a raw results.
         */
        this.queryEntity = false;
        /**
         * All aliases (including main alias) used in the query.
         */
        this.aliases = [];
        /**
         * Represents query type. QueryBuilder is able to build SELECT, UPDATE and DELETE queries.
         */
        this.queryType = "select";
        /**
         * Data needs to be SELECT-ed.
         */
        this.selects = [];
        /**
         * Whether SELECT is DISTINCT.
         */
        this.selectDistinct = false;
        /**
         * SELECT DISTINCT ON query (postgres).
         */
        this.selectDistinctOn = [];
        /**
         * Extra returning columns to be added to the returning statement if driver supports it.
         */
        this.extraReturningColumns = [];
        /**
         * Optional on conflict statement used in insertion query in postgres.
         */
        this.onConflict = "";
        /**
         * Optional on ignore statement used in insertion query in databases.
         */
        this.onIgnore = false;
        /**
         * JOIN queries.
         */
        this.joinAttributes = [];
        /**
         * RelationId queries.
         */
        this.relationIdAttributes = [];
        /**
         * Relation count queries.
         */
        this.relationCountAttributes = [];
        /**
         * WHERE queries.
         */
        this.wheres = [];
        /**
         * HAVING queries.
         */
        this.havings = [];
        /**
         * ORDER BY queries.
         */
        this.orderBys = {};
        /**
         * GROUP BY queries.
         */
        this.groupBys = [];
        /**
         * Indicates if soft-deleted rows should be included in entity result.
         * By default the soft-deleted rows are not included.
         */
        this.withDeleted = false;
        /**
         * Parameters used to be escaped in final query.
         */
        this.parameters = {};
        /**
         * Indicates if alias, table names and column names will be ecaped by driver, or not.
         *
         * todo: rename to isQuotingDisabled, also think if it should be named "escaping"
         */
        this.disableEscaping = true;
        /**
         * Indicates if virtual columns should be included in entity result.
         *
         * todo: what to do with it? is it properly used? what about persistence?
         */
        this.enableRelationIdValues = false;
        /**
         * Extra where condition appended to the end of original where conditions with AND keyword.
         * Original condition will be wrapped into brackets.
         */
        this.extraAppendedAndWhereCondition = "";
        /**
         * Indicates if query builder creates a subquery.
         */
        this.subQuery = false;
        /**
         * Indicates if property names are prefixed with alias names during property replacement.
         * By default this is enabled, however we need this because aliases are not supported in UPDATE and DELETE queries,
         * but user can use them in WHERE expressions.
         */
        this.aliasNamePrefixingEnabled = true;
        /**
         * Indicates if query result cache is enabled or not.
         */
        this.cache = false;
        /**
         * Options that define QueryBuilder behaviour.
         */
        this.options = [];
        /**
         * List of columns where data should be inserted.
         * Used in INSERT query.
         */
        this.insertColumns = [];
        /**
         * Used if user wants to update or delete a specific entities.
         */
        this.whereEntities = [];
        /**
         * Indicates if entity must be updated after insertion / updation.
         * This may produce extra query or use RETURNING / OUTPUT statement (depend on database).
         */
        this.updateEntity = true;
        /**
         * Indicates if listeners and subscribers must be called before and after query execution.
         */
        this.callListeners = true;
        /**
         * Indicates if query must be wrapped into transaction.
         */
        this.useTransaction = false;
        /**
         * Extra parameters.
         * Used in InsertQueryBuilder to avoid default parameters mechanizm and execute high performance insertions.
         */
        this.nativeParameters = {};
    }
    Object.defineProperty(QueryExpressionMap.prototype, "allOrderBys", {
        // -------------------------------------------------------------------------
        // Accessors
        // -------------------------------------------------------------------------
        /**
         * Get all ORDER BY queries - if order by is specified by user then it uses them,
         * otherwise it uses default entity order by if it was set.
         */
        get: function () {
            var _this = this;
            if (!Object.keys(this.orderBys).length && this.mainAlias.hasMetadata && this.options.indexOf("disable-global-order") === -1) {
                var entityOrderBy_1 = this.mainAlias.metadata.orderBy || {};
                return Object.keys(entityOrderBy_1).reduce(function (orderBy, key) {
                    orderBy[_this.mainAlias.name + "." + key] = entityOrderBy_1[key];
                    return orderBy;
                }, {});
            }
            return this.orderBys;
        },
        enumerable: false,
        configurable: true
    });
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a main alias and adds it to the current expression map.
     */
    QueryExpressionMap.prototype.setMainAlias = function (alias) {
        // if main alias is already set then remove it from the array
        // if (this.mainAlias)
        //     this.aliases.splice(this.aliases.indexOf(this.mainAlias));
        // set new main alias
        this.mainAlias = alias;
        return alias;
    };
    /**
     * Creates a new alias and adds it to the current expression map.
     */
    QueryExpressionMap.prototype.createAlias = function (options) {
        var aliasName = options.name;
        if (!aliasName && options.tablePath)
            aliasName = options.tablePath;
        if (!aliasName && options.target instanceof Function)
            aliasName = options.target.name;
        if (!aliasName && typeof options.target === "string")
            aliasName = options.target;
        var alias = new Alias();
        alias.type = options.type;
        if (aliasName)
            alias.name = aliasName;
        if (options.metadata)
            alias.metadata = options.metadata;
        if (options.target && !alias.hasMetadata)
            alias.metadata = this.connection.getMetadata(options.target);
        if (options.tablePath)
            alias.tablePath = options.tablePath;
        if (options.subQuery)
            alias.subQuery = options.subQuery;
        this.aliases.push(alias);
        return alias;
    };
    /**
     * Finds alias with the given name.
     * If alias was not found it throw an exception.
     */
    QueryExpressionMap.prototype.findAliasByName = function (aliasName) {
        var alias = this.aliases.find(function (alias) { return alias.name === aliasName; });
        if (!alias)
            throw new Error("\"" + aliasName + "\" alias was not found. Maybe you forgot to join it?");
        return alias;
    };
    QueryExpressionMap.prototype.findColumnByAliasExpression = function (aliasExpression) {
        var _a = __read(aliasExpression.split("."), 2), aliasName = _a[0], propertyPath = _a[1];
        var alias = this.findAliasByName(aliasName);
        return alias.metadata.findColumnWithPropertyName(propertyPath);
    };
    Object.defineProperty(QueryExpressionMap.prototype, "relationMetadata", {
        /**
         * Gets relation metadata of the relation this query builder works with.
         *
         * todo: add proper exceptions
         */
        get: function () {
            if (!this.mainAlias)
                throw new Error("Entity to work with is not specified!"); // todo: better message
            var relationMetadata = this.mainAlias.metadata.findRelationWithPropertyPath(this.relationPropertyPath);
            if (!relationMetadata)
                throw new Error("Relation " + this.relationPropertyPath + " was not found in entity " + this.mainAlias.name); // todo: better message
            return relationMetadata;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Copies all properties of the current QueryExpressionMap into a new one.
     * Useful when QueryBuilder needs to create a copy of itself.
     */
    QueryExpressionMap.prototype.clone = function () {
        var _this = this;
        var map = new QueryExpressionMap(this.connection);
        map.queryType = this.queryType;
        map.selects = this.selects.map(function (select) { return select; });
        map.selectDistinct = this.selectDistinct;
        map.selectDistinctOn = this.selectDistinctOn;
        this.aliases.forEach(function (alias) { return map.aliases.push(new Alias(alias)); });
        map.mainAlias = this.mainAlias;
        map.valuesSet = this.valuesSet;
        map.returning = this.returning;
        map.onConflict = this.onConflict;
        map.onIgnore = this.onIgnore;
        map.onUpdate = this.onUpdate;
        map.joinAttributes = this.joinAttributes.map(function (join) { return new JoinAttribute(_this.connection, _this, join); });
        map.relationIdAttributes = this.relationIdAttributes.map(function (relationId) { return new RelationIdAttribute(_this, relationId); });
        map.relationCountAttributes = this.relationCountAttributes.map(function (relationCount) { return new RelationCountAttribute(_this, relationCount); });
        map.wheres = this.wheres.map(function (where) { return (__assign({}, where)); });
        map.havings = this.havings.map(function (having) { return (__assign({}, having)); });
        map.orderBys = Object.assign({}, this.orderBys);
        map.groupBys = this.groupBys.map(function (groupBy) { return groupBy; });
        map.limit = this.limit;
        map.offset = this.offset;
        map.skip = this.skip;
        map.take = this.take;
        map.lockMode = this.lockMode;
        map.lockVersion = this.lockVersion;
        map.lockTables = this.lockTables;
        map.withDeleted = this.withDeleted;
        map.parameters = Object.assign({}, this.parameters);
        map.disableEscaping = this.disableEscaping;
        map.enableRelationIdValues = this.enableRelationIdValues;
        map.extraAppendedAndWhereCondition = this.extraAppendedAndWhereCondition;
        map.subQuery = this.subQuery;
        map.aliasNamePrefixingEnabled = this.aliasNamePrefixingEnabled;
        map.cache = this.cache;
        map.cacheId = this.cacheId;
        map.cacheDuration = this.cacheDuration;
        map.relationPropertyPath = this.relationPropertyPath;
        map.of = this.of;
        map.insertColumns = this.insertColumns;
        map.whereEntities = this.whereEntities;
        map.updateEntity = this.updateEntity;
        map.callListeners = this.callListeners;
        map.useTransaction = this.useTransaction;
        map.nativeParameters = Object.assign({}, this.nativeParameters);
        map.comment = this.comment;
        return map;
    };
    return QueryExpressionMap;
}());
export { QueryExpressionMap };

//# sourceMappingURL=QueryExpressionMap.js.map
