import {EntityMetadata} from "./EntityMetadata";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "./ColumnMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";

/**
 * Index metadata contains all information about table's index.
 */
export class IndexMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata of the class to which this index is applied.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata if this index was applied on embedded.
     */
    embeddedMetadata?: EmbeddedMetadata;

    /**
     * Indicates if this index must be unique.
     */
    isUnique: boolean = false;

    /**
     * Indicates if this index must synchronize with database index.
     */
    synchronize?: boolean;

    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    isSparse?: boolean;

    /**
     * Target class to which metadata is applied.
     */
    target?: Function|string;

    /**
     * Indexed columns.
     */
    columns: ColumnMetadata[] = [];

    /**
     * User specified index name.
     */
    givenName?: string;

    /**
     * User specified column names.
     */
    givenColumnNames?: ((object?: any) => (any[]|{ [key: string]: number }))|string[];

    /**
     * Final index name.
     * If index name was given by a user then it stores normalized (by naming strategy) givenName.
     * If index name was not given then its generated.
     */
    name: string;

    /**
     * Index filter condition.
     */
    where?: string;

    /**
     * Map of column names with order set.
     * Used only by MongoDB driver.
     */
    columnNamesWithOrderingMap: { [key: string]: number } = {};

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        embeddedMetadata?: EmbeddedMetadata,
        columns?: ColumnMetadata[],
        args?: IndexMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata;
        this.embeddedMetadata = options.embeddedMetadata;
        if (options.columns)
            this.columns = options.columns;

        if (options.args) {
            this.target = options.args.target;
            this.synchronize = options.args.synchronize;
            this.isUnique = options.args.unique;
            this.where = options.args.where;
            this.isSparse = options.args.sparse;
            this.givenName = options.args.name;
            this.givenColumnNames = options.args.columns;
        }
    }

    // ---------------------------------------------------------------------
    // Public Build Methods
    // ---------------------------------------------------------------------

    /**
     * Builds some depend index properties.
     * Must be called after all entity metadata's properties map, columns and relations are built.
     */
    build(namingStrategy: NamingStrategyInterface): this {
        if (this.synchronize === false) {
            this.name = this.givenName!;
            return this;
        }

        const map: { [key: string]: number } = {};

        // if columns already an array of string then simply return it
        if (this.givenColumnNames) {
            let columnPropertyPaths: string[] = [];
            if (this.givenColumnNames instanceof Array) {
                columnPropertyPaths = this.givenColumnNames.map(columnName => {
                    if (this.embeddedMetadata)
                        return this.embeddedMetadata.propertyPath + "." + columnName;

                    return columnName;
                });
                columnPropertyPaths.forEach(propertyPath => map[propertyPath] = 1);
            } else { // todo: indices in embeds are not implemented in this syntax. deprecate this syntax?
                // if columns is a function that returns array of field names then execute it and get columns names from it
                const columnsFnResult = this.givenColumnNames(this.entityMetadata.propertiesMap);
                if (columnsFnResult instanceof Array) {
                    columnPropertyPaths = columnsFnResult.map((i: any) => String(i));
                    columnPropertyPaths.forEach(name => map[name] = 1);
                } else {
                    columnPropertyPaths = Object.keys(columnsFnResult).map((i: any) => String(i));
                    Object.keys(columnsFnResult).forEach(columnName => map[columnName] = columnsFnResult[columnName]);
                }
            }

            this.columns = columnPropertyPaths.map(propertyPath => {
                const columnWithSameName = this.entityMetadata.columns.find(column => column.propertyPath === propertyPath);
                if (columnWithSameName) {
                    return [columnWithSameName];
                }
                const relationWithSameName = this.entityMetadata.relations.find(relation => relation.isWithJoinColumn && relation.propertyName === propertyPath);
                if (relationWithSameName) {
                    return relationWithSameName.joinColumns;
                }
                throw new Error(`Index ${this.givenName ? "\"" + this.givenName + "\" " : ""}contains column that is missing in the entity: ` + propertyPath);
            })
            .reduce((a, b) => a.concat(b));
        }

        this.columnNamesWithOrderingMap = Object.keys(map).reduce((updatedMap, key) => {
            const column = this.entityMetadata.columns.find(column => column.propertyPath === key);
            if (column)
                updatedMap[column.databaseName] = map[key];
            return updatedMap;
        }, {} as { [key: string]: number });
        this.name = this.givenName ? this.givenName : namingStrategy.indexName(this.entityMetadata.tablePath, this.columns.map(column => column.databaseName), this.where);
        return this;
    }

}