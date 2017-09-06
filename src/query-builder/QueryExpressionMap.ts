import {Alias} from "./Alias";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {OrderByCondition} from "../find-options/OrderByCondition";
import {JoinAttribute} from "./JoinAttribute";
import {RelationIdAttribute} from "./relation-id/RelationIdAttribute";
import {RelationCountAttribute} from "./relation-count/RelationCountAttribute";
import {Connection} from "../connection/Connection";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {SelectQuery} from "./SelectQuery";
import {ColumnMetadata} from "../metadata/ColumnMetadata";

/**
 * Contains all properties of the QueryBuilder that needs to be build a final query.
 */
export class QueryExpressionMap {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if QueryBuilder used to select entities and not a raw results.
     */
    queryEntity: boolean = false;

    /**
     * Main alias is a main selection object selected by QueryBuilder.
     */
    mainAlias?: Alias;

    /**
     * All aliases (including main alias) used in the query.
     */
    aliases: Alias[] = [];

    /**
     * Represents query type. QueryBuilder is able to build SELECT, UPDATE and DELETE queries.
     */
    queryType: "select"|"update"|"delete"|"insert"|"relation" = "select";

    /**
     * Data needs to be SELECT-ed.
     */
    selects: SelectQuery[] = [];

    /**
     * FROM-s to be selected.
     */
    // froms: { target: string, alias: string }[] = [];

    /**
     * If update query was used, it needs "update set" - properties which will be updated by this query.
     * If insert query was used, it needs "insert set" - values that needs to be inserted.
     */
    valuesSet?: ObjectLiteral|ObjectLiteral[];

    /**
     * Optional returning (or output) clause for insert, update or delete queries.
     */
    returning: string = "";

    /**
     * JOIN queries.
     */
    joinAttributes: JoinAttribute[] = [];

    /**
     * RelationId queries.
     */
    relationIdAttributes: RelationIdAttribute[] = [];

    /**
     * Relation count queries.
     */
    relationCountAttributes: RelationCountAttribute[] = [];

    /**
     * WHERE queries.
     */
    wheres: { type: "simple"|"and"|"or", condition: string }[] = [];

    /**
     * HAVING queries.
     */
    havings: { type: "simple"|"and"|"or", condition: string }[] = [];

    /**
     * ORDER BY queries.
     */
    orderBys: OrderByCondition = {};

    /**
     * GROUP BY queries.
     */
    groupBys: string[] = [];

    /**
     * LIMIT query.
     */
    limit?: number;

    /**
     * OFFSET query.
     */
    offset?: number;

    /**
     * Number of rows to skip of result using pagination.
     */
    skip?: number;

    /**
     * Number of rows to take using pagination.
     */
    take?: number;

    /**
     * Locking mode.
     */
    lockMode?: "optimistic"|"pessimistic_read"|"pessimistic_write";

    /**
     * Current version of the entity, used for locking.
     */
    lockVersion?: number|Date;

    /**
     * Parameters used to be escaped in final query.
     */
    parameters: ObjectLiteral = {};

    /**
     * Indicates if alias, table names and column names will be ecaped by driver, or not.
     *
     * todo: rename to isQuotingDisabled, also think if it should be named "escaping"
     */
    disableEscaping: boolean = true;

    /**
     * todo: needs more information.
     */
    ignoreParentTablesJoins: boolean = false;

    /**
     * Indicates if virtual columns should be included in entity result.
     *
     * todo: what to do with it? is it properly used? what about persistence?
     */
    enableRelationIdValues: boolean = false;

    /**
     * Extra where condition appended to the end of original where conditions with AND keyword.
     * Original condition will be wrapped into brackets.
     */
    extraAppendedAndWhereCondition: string = "";

    /**
     * Indicates if query builder creates a subquery.
     */
    subQuery: boolean = false;

    /**
     * Indicates if property names are prefixed with alias names during property replacement.
     * By default this is enabled, however we need this because aliases are not supported in UPDATE and DELETE queries,
     * but user can use them in WHERE expressions.
     */
    aliasNamePrefixingEnabled: boolean = true;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Get all ORDER BY queries - if order by is specified by user then it uses them,
     * otherwise it uses default entity order by if it was set.
     */
    get allOrderBys() {
        if (!Object.keys(this.orderBys).length && this.mainAlias!.hasMetadata) {
            const entityOrderBy = this.mainAlias!.metadata.orderBy || {};
            return Object.keys(entityOrderBy).reduce((orderBy, key) => {
                orderBy[this.mainAlias!.name + "." + key] = entityOrderBy[key];
                return orderBy;
            }, {} as OrderByCondition);
        }

        return this.orderBys;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a main alias and adds it to the current expression map.
     */
    setMainAlias(alias: Alias): Alias {

        // if main alias is already set then remove it from the array
        if (this.mainAlias)
            this.aliases.splice(this.aliases.indexOf(this.mainAlias));

        // set new main alias
        this.mainAlias = alias;

        return alias;
    }

    /**
     * Creates a new alias and adds it to the current expression map.
     */
    createAlias(options: { name?: string, target?: Function|string, tableName?: string, subQuery?: string, metadata?: EntityMetadata }): Alias {

        let aliasName = options.name;
        if (!aliasName && options.tableName)
            aliasName = options.tableName;
        if (!aliasName && options.target instanceof Function)
            aliasName = options.target.name;
        if (!aliasName && typeof options.target === "string")
            aliasName = options.target;

        const alias = new Alias();
        if (aliasName)
            alias.name = aliasName;
        if (options.metadata)
            alias.metadata = options.metadata;
        if (options.target && !alias.hasMetadata)
            alias.metadata = this.connection.getMetadata(options.target);
        if (options.tableName)
            alias.tableName = options.tableName;
        if (options.subQuery)
            alias.subQuery = options.subQuery;

        this.aliases.push(alias);
        return alias;
    }

    /**
     * Finds alias with the given name.
     * If alias was not found it throw an exception.
     */
    findAliasByName(aliasName: string): Alias {
        const alias = this.aliases.find(alias => alias.name === aliasName);
        if (!alias)
            throw new Error(`"${aliasName}" alias was not found. Maybe you forgot to join it?`);

        return alias;
    }

    findColumnByAliasExpression(aliasExpression: string): ColumnMetadata|undefined {
        const [aliasName, propertyPath] = aliasExpression.split(".");
        const alias = this.findAliasByName(aliasName);
        return alias.metadata.findColumnWithPropertyName(propertyPath);
    }

    /**
     * Copies all properties of the current QueryExpressionMap into a new one.
     * Useful when QueryBuilder needs to create a copy of itself.
     */
    clone(): QueryExpressionMap {
        const map = new QueryExpressionMap(this.connection);
        map.queryType = this.queryType;
        map.selects = this.selects.map(select => select);
        this.aliases.forEach(alias => map.aliases.push(new Alias(alias)));
        map.mainAlias = this.mainAlias;
        map.valuesSet = this.valuesSet;
        map.joinAttributes = this.joinAttributes.map(join => new JoinAttribute(this.connection, this, join));
        map.relationIdAttributes = this.relationIdAttributes.map(relationId => new RelationIdAttribute(this, relationId));
        map.relationCountAttributes = this.relationCountAttributes.map(relationCount => new RelationCountAttribute(this, relationCount));
        map.wheres = this.wheres.map(where => ({ ...where }));
        map.havings = this.havings.map(having => ({ ...having }));
        map.orderBys = Object.assign({}, this.orderBys);
        map.groupBys = this.groupBys.map(groupBy => groupBy);
        map.limit = this.limit;
        map.offset = this.offset;
        map.skip = this.skip;
        map.take = this.take;
        map.lockMode = this.lockMode;
        map.lockVersion = this.lockVersion;
        map.parameters = Object.assign({}, this.parameters);
        map.disableEscaping = this.disableEscaping;
        map.ignoreParentTablesJoins = this.ignoreParentTablesJoins;
        map.enableRelationIdValues = this.enableRelationIdValues;
        return map;
    }

}