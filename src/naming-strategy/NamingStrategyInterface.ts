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
     * Gets the table name from the given class name.
     */
    tableName(className: string, customName?: string): string;

    /**
     * Gets the table's column name from the given property name.
     */
    columnName(propertyName: string, customName?: string): string;

    /**
     * Gets the embedded's column name from the given property name.
     */
    embeddedColumnName(prefixes: string[], columnPropertyName: string, columnCustomName?: string): string;

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
    joinColumnInverseSideName(joinColumnName: string|undefined, propertyName: string): string;

    /**
     * Gets the name of the join table used in the many-to-many relations.
     */
    joinTableName(firstTableName: string,
                  secondTableName: string,
                  firstPropertyName: string,
                  secondPropertyName: string,
                  firstColumnName: string,
                  secondColumnName: string): string;

    /**
     * Gets the name of the column used for columns in the junction tables.
     */
    joinTableColumnName(tableName: string, columnName: string, secondTableName: string, secondColumnName: string): string;

    /**
     * Gets the name of the column used for second column name in the junction tables.
     */
    joinTableInverseColumnName(tableName: string, columnName: string, secondTableName: string, secondColumnName: string): string;

    /**
     * Gets the name for the closure junction table.
     */
    closureJunctionTableName(tableName: string): string;

    /**
     * Gets the name of the foreign key.
     */
    foreignKeyName(tableName: string, columnNames: string[], referencedTableName: string, referencedColumnNames: string[]): string;

    /**
     * Gets the column name of the column with foreign key to the parent table used in the class table inheritance.
     */
    classTableInheritanceParentColumnName(parentTableName: any, parentTableIdPropertyName: any): string;

    /**
     * Adds prefix to the table.
     */
    prefixTableName(prefix: string, originalTableName: string): string;

}