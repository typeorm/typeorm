"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableForeignKey = void 0;
/**
 * Foreign key from the database stored in this class.
 */
class TableForeignKey {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options) {
        /**
         * Column names which included by this foreign key.
         */
        this.columnNames = [];
        /**
         * Column names which included by this foreign key.
         */
        this.referencedColumnNames = [];
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.referencedColumnNames = options.referencedColumnNames;
        this.referencedTableName = options.referencedTableName;
        this.onDelete = options.onDelete;
        this.onUpdate = options.onUpdate;
        this.deferrable = options.deferrable;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this foreign key with exactly same properties.
     */
    clone() {
        return new TableForeignKey({
            name: this.name,
            columnNames: [...this.columnNames],
            referencedColumnNames: [...this.referencedColumnNames],
            referencedTableName: this.referencedTableName,
            onDelete: this.onDelete,
            onUpdate: this.onUpdate,
            deferrable: this.deferrable,
        });
    }
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new table foreign key from the given foreign key metadata.
     */
    static create(metadata) {
        return new TableForeignKey({
            name: metadata.name,
            columnNames: metadata.columnNames,
            referencedColumnNames: metadata.referencedColumnNames,
            referencedTableName: metadata.referencedTablePath,
            onDelete: metadata.onDelete,
            onUpdate: metadata.onUpdate,
            deferrable: metadata.deferrable,
        });
    }
}
exports.TableForeignKey = TableForeignKey;

//# sourceMappingURL=TableForeignKey.js.map
