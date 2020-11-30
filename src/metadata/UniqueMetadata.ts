import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {EntityMetadata} from "./EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "./ColumnMetadata";
import {UniqueMetadataArgs} from "../metadata-args/UniqueMetadataArgs";
import {IndexFields, IndexFieldsFn} from "../metadata-args/types/IndexFields";

/**
 * Unique metadata contains all information about table's unique constraints.
 */
export class UniqueMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata of the class to which this unique constraint is applied.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata if this unique was applied on embedded.
     */
    embeddedMetadata?: EmbeddedMetadata;

    /**
     * Target class to which metadata is applied.
     */
    target?: Function|string;

    /**
     * Unique columns.
     */
    columns: ColumnMetadata[] = [];

    /**
     * User specified unique constraint name.
     */
    givenName?: string;

    /**
     * User specified column names.
     */
    givenColumnNames?: IndexFields | IndexFieldsFn;

    /**
     * Final unique constraint name.
     * If unique constraint name was given by a user then it stores normalized (by naming strategy) givenName.
     * If unique constraint name was not given then its generated.
     */
    name: string;

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
        args?: UniqueMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata;
        this.embeddedMetadata = options.embeddedMetadata;
        if (options.columns)
            this.columns = options.columns;

        if (options.args) {
            this.target = options.args.target;
            this.givenName = options.args.name;
            this.givenColumnNames = options.args.columns;
        }
    }

    // ---------------------------------------------------------------------
    // Public Build Methods
    // ---------------------------------------------------------------------

    /**
     * Builds some depend unique constraint properties.
     * Must be called after all entity metadata's properties map, columns and relations are built.
     */
    build(namingStrategy: NamingStrategyInterface): this {
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
                throw new Error(`Unique constraint ${indexName}contains column that is missing in the entity (${entityName}): ` + propertyPath);
            });

        }

        this.name = this.givenName ? this.givenName : namingStrategy.uniqueConstraintName(this.entityMetadata.tablePath, this.columns.map(column => column.databaseName));
        return this;
    }

}
