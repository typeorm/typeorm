import { OrderByCondition } from "../../find-options/OrderByCondition"

/**
 * Describes all entity's options.
 */
export interface EntityOptions {
    /**
     * Table name.
     * If not specified then naming strategy will generate table name from entity name.
     */
    name?: string

    /**
     * Specifies a default order by used for queries from this table when no explicit order by is specified.
     */
    orderBy?: OrderByCondition | ((object: any) => OrderByCondition | any)

    /**
     * Table's database engine type (like "InnoDB", "MyISAM", etc).
     * It is used only during table creation.
     * If you update this value and table is already created, it will not change table's engine type.
     * Note that not all databases support this option.
     */
    engine?: string

    /**
     * Database name. Used in Mysql and Sql Server.
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
     * If set to 'true' this option disables Sqlite's default behaviour of secretly creating
     * an integer primary key column named 'rowid' on table creation.
     * @see https://www.sqlite.org/withoutrowid.html.
     */
    withoutRowid?: boolean

    /**
     * Enables strict mode. This will make sure that columns are always treated with their defined types.
     * For example, if a column is defined as an integer, it will always be treated as an integer.
     * This can help prevent issues with type coercion and ensure data integrity.
     *
     * @see https://www.sqlite.org/stricttables.html
     */
    strict?: boolean

    /**
     * Table comment. Not supported by all database types.
     */
    comment?: string
}
