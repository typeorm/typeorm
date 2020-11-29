/**
 * Kinda type of the column. Not a type in the database, but locally used type to determine what kind of column
 * we are working with.
 * For example, "internal" means that it will be a hidden internal column, or "createDate" means that it will create a create
 * date column.
 */
export type ColumnMode = "regular"|"internal"|"createDate"|"updateDate"|"deleteDate"|"version"|"treeChildrenCount"|"treeLevel"|"objectId"|"array";
