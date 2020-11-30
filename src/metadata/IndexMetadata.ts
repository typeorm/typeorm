import {EntityMetadata} from "./EntityMetadata";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "./ColumnMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {IndexFields, IndexFieldsFn} from "../metadata-args/types/IndexFields";

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
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL.
     */
    isSpatial: boolean = false;

    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Works only in MySQL.
     */
    isFulltext: boolean = false;

    /**
     * Fulltext parser.
     * Works only in MySQL.
     */
    parser?: string;

    /**
     * Indicates if this index must synchronize with database index.
     */
    synchronize: boolean = true;

    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    isSparse?: boolean;

    /**
     * Builds the index in the background so that building an index an does not block other database activities.
     * This option is only supported for mongodb database.
     */
    isBackground?: boolean;

    /**
     * Specifies a time to live, in seconds.
     * This option is only supported for mongodb database.
     */
    expireAfterSeconds?: number;

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
    givenColumnNames?: IndexFields | IndexFieldsFn;

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
    columnNamesWithOrderingMap: Record<string, number> = {};

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
            if (options.args.synchronize !== null && options.args.synchronize !== undefined)
                this.synchronize = options.args.synchronize;
            this.isUnique = !!options.args.unique;
            this.isSpatial = !!options.args.spatial;
            this.isFulltext = !!options.args.fulltext;
            this.parser = options.args.parser;
            this.where = options.args.where;
            this.isSparse = options.args.sparse;
            this.isBackground = options.args.background;
            this.expireAfterSeconds = options.args.expireAfterSeconds;
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

        if (this.givenColumnNames) {
            // Unwrap if function
            let givenColumnNames: IndexFields = <IndexFields>(typeof this.givenColumnNames !== "function"
                ? this.givenColumnNames : this.givenColumnNames(this.entityMetadata.propertiesMap));

            let propertyPaths: string[];
            let propertyPathsWithOrderingMap: Record<string, number> = {};
            if (Array.isArray(givenColumnNames)) {
                // Array of property paths provided
                propertyPaths = givenColumnNames.map(propertyPath => {
                    propertyPath = String(propertyPath);
                    if (this.embeddedMetadata)
                        propertyPath = this.embeddedMetadata.propertyPath + "." + propertyPath;
                    return propertyPath;
                });
                propertyPaths.forEach(propertyPath => propertyPathsWithOrderingMap[propertyPath] = 1);
            } else {
                // Object of property paths to order direction provided
                propertyPaths = [];
                Object.keys(givenColumnNames).forEach(propertyPath => {
                    const order = (givenColumnNames as Record<string, number>)[propertyPath];
                    propertyPath = String(propertyPath);
                    if (this.embeddedMetadata)
                        propertyPath = this.embeddedMetadata.propertyPath + "." + propertyPath;

                    propertyPaths.push(propertyPath);
                    propertyPathsWithOrderingMap[propertyPath] = order;
                });
            }

            this.columns = [];
            this.columnNamesWithOrderingMap = {};
            propertyPaths.forEach(propertyPath => {
                const columnWithSameName = this.entityMetadata.columns.find(column => column.propertyPath === propertyPath);
                if (columnWithSameName) {
                    this.columns.push(columnWithSameName);
                    this.columnNamesWithOrderingMap[columnWithSameName.databasePath] = propertyPathsWithOrderingMap[propertyPath];
                    return;
                }

                const relationWithSameName = this.entityMetadata.relations.find(relation => relation.isWithJoinColumn && relation.propertyName === propertyPath);
                if (relationWithSameName) {
                    this.columns.push(...relationWithSameName.joinColumns);
                    return;
                }

                const indexName = this.givenName ? "\"" + this.givenName + "\" " : "";
                const entityName = this.entityMetadata.targetName;
                throw new Error(`Index ${indexName}contains column that is missing in the entity (${entityName}): ` + propertyPath);
            });

        }

        this.name = this.givenName ? this.givenName : namingStrategy.indexName(this.entityMetadata.tablePath, this.columns.map(column => column.databaseName), this.where);
        return this;
    }

}
