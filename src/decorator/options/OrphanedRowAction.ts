export enum OrphanedRowAction {
    /**
     * Sets the foreign key of a row to null, effectively orphaning the row from the parent.
     */
    Nullify = "nullify",

    /**
     * Deletes the orphaned row from the database when it is removed from the parent.
     */
    Delete = "delete"
}