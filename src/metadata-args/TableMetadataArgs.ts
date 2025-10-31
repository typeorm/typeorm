import { DataSource, SelectQueryBuilder } from ".."
import { OrderByCondition } from "../find-options/OrderByCondition"
import { TableType } from "../metadata/types/TableTypes"

/**
 * Arguments for TableMetadata class, helps to construct an TableMetadata object.
 */
export interface TableMetadataArgs {
    /**
     * Class to which table is applied.
     * Function target is a table defined in the class.
     * String target is a table defined in a json schema.
     */
    target: Function | string

    /**
     * Target's name used for entity identification in relations and metadata resolution.
     * This is particularly useful when code minification changes class names, breaking
     * string-based entity references in relations (e.g., @ManyToOne('EntityName')).
     *
     * If not specified, TypeORM will use the following priority order:
     * 1. The class name (target.name, which may be minified)
     * 2. The target itself (if target is a string)
     *
     * This allows developers to ensure consistent entity resolution even when class
     * names are mangled by minifiers like UglifyJS or Terser.
     */
    targetName?: string

    /**
     * Table's name. If name is not set then table's name will be generated from target's name.
     */
    name?: string

    /**
     * Table type. Tables can be abstract, closure, junction, embedded, etc.
     */
    type: TableType

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    orderBy?: OrderByCondition | ((object: any) => OrderByCondition | any)

    /**
     * Table's database engine type (like "InnoDB", "MyISAM", etc).
     */
    engine?: string

    /**
     * Database name. Used in MySql and Sql Server.
     */
    database?: string

    /**
     * Schema name. Used in Postgres and Sql Server.
     */
    schema?: string

    /**
     * Indicates if schema synchronization is enabled or disabled for this entity.
     * If it will be set to false then schema sync will and migrations ignore this entity.
     * By default schema synchronization is enabled for all entities.
     */
    synchronize?: boolean

    /**
     * View expression.
     */
    expression?: string | ((connection: DataSource) => SelectQueryBuilder<any>)

    /**
     * View dependencies.
     */
    dependsOn?: Set<Function | string>

    /**
     * Indicates if view is materialized
     */
    materialized?: boolean

    /**
     * If set to 'true' this option disables Sqlite's default behaviour of secretly creating
     * an integer primary key column named 'rowid' on table creation.
     */
    withoutRowid?: boolean

    /**
     * Table comment. Not supported by all database types.
     */
    comment?: string
}
