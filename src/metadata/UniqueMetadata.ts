import {EntityMetadata} from "./EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "./ColumnMetadata";
import {UniqueMetadataArgs} from "../metadata-args/UniqueMetadataArgs";

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
    givenColumnNames?: ((object?: any) => (any[]|{ [key: string]: number }))|string[];

    /**
     * Final unique constraint name.
     * If unique constraint name was given by a user then it stores normalized (by naming strategy) givenName.
     * If unique constraint name was not given then its generated.
     */
    name: string;

    /**
     * Gets the table name on which unique constraint is applied.
     */
    tableName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        columns?: ColumnMetadata[],
        args?: UniqueMetadataArgs
    }) {
        this.entityMetadata = options.entityMetadata;
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

        const map: { [key: string]: number } = {};
        this.tableName = this.entityMetadata.tableName;

        // if columns already an array of string then simply return it
        if (this.givenColumnNames) {
            let columnPropertyNames: string[] = [];
            if (this.givenColumnNames instanceof Array) {
                columnPropertyNames = this.givenColumnNames;
                columnPropertyNames.forEach(name => map[name] = 1);
            } else {
                // if columns is a function that returns array of field names then execute it and get columns names from it
                const columnsFnResult = this.givenColumnNames(this.entityMetadata.propertiesMap);
                if (columnsFnResult instanceof Array) {
                    columnPropertyNames = columnsFnResult.map((i: any) => String(i));
                    columnPropertyNames.forEach(name => map[name] = 1);
                } else {
                    columnPropertyNames = Object.keys(columnsFnResult).map((i: any) => String(i));
                    Object.keys(columnsFnResult).forEach(columnName => map[columnName] = columnsFnResult[columnName]);
                }
            }

            this.columns = columnPropertyNames.map(propertyName => {
                const columnWithSameName = this.entityMetadata.columns.find(column => column.propertyPath === propertyName);
                if (columnWithSameName) {
                    return [columnWithSameName];
                }
                const relationWithSameName = this.entityMetadata.relations.find(relation => relation.isWithJoinColumn && relation.propertyName === propertyName);
                if (relationWithSameName) {
                    return relationWithSameName.joinColumns;
                }
                throw new Error(`Unique constraint ${this.givenName ? "\"" + this.givenName + "\" " : ""}contains column that is missing in the entity: ` + propertyName);
            })
            .reduce((a, b) => a.concat(b));
        }
        this.name = this.givenName ? this.givenName : namingStrategy.uniqueConstraintName(this.entityMetadata.tablePath, this.columns.map(column => column.databaseName));
        return this;
    }

}