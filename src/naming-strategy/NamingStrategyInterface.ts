/**
 * Naming strategy defines how auto-generated names for such things like table name, or table column gonna be
 * generated.
 */
export interface NamingStrategyInterface {

    /**
     * Naming strategy name.
     */
    name?: string;

    /**
     * Normalizes table name.
     *
     * @param targetName Name of the target entity that can be used to generate a table name.
     * @param userSpecifiedName For example if user specified a table name in a decorator, e.g. @Entity("name")
     */
    tableName(targetName: string, userSpecifiedName: string|undefined): string;

    /**
     * Creates a table name for a junction table of a closure table.
     *
     * @param originalClosureTableName Name of the closure table which owns this junction table.
     */
    closureJunctionTableName(originalClosureTableName: string): string;

    /**
     * Gets the table's column name from the given property name.
     */
    columnName(propertyName: string, customName: string|undefined, embeddedPrefixes: string[]): string;

    /**
     * Gets the table's relation name from the given property name.
     */
    relationName(propertyName: string): string;

    /**
     * Gets the name of the index - simple and compose index.
     */
    indexName(customName: string|undefined, tableName: string, columns: string[]): string;

    /**
     * Gets the name of the join column used in the one-to-one and many-to-one relations.
     */
    joinColumnName(relationName: string, referencedColumnName: string): string;

    /**
     * Gets the name of the join table used in the many-to-many relations.
     */
    joinTableName(firstTableName: string,
                  secondTableName: string,
                  firstPropertyName: string,
                  secondPropertyName: string): string;

    /**
     * Columns in join tables can have duplicate names in case of self-referencing.
     * This method provide a resolution for such column names.
     */
    joinTableColumnDuplicationPrefix(columnName: string, index: number): string;

    /**
     * Gets the name of the column used for columns in the junction tables.
     */
    joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string;

    /**
     * Gets the name of the foreign key.
     */
    foreignKeyName(tableName: string, columnNames: string[], referencedTableName: string, referencedColumnNames: string[]): string;

    /**
     * Gets the column name of the column with foreign key to the parent table used in the class table inheritance.
     */
    classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string;

    /**
     * Adds globally set prefix to the table name.
     * This method is executed no matter if prefix was set or not.
     * Table name is either user's given table name, either name generated from entity target.
     * Note that table name comes here already normalized by #tableName method.
     */
    prefixTableName(prefix: string, tableName: string): string;

}