import {ColumnSchema} from "./ColumnSchema";
import {IndexSchema} from "./IndexSchema";
import {ForeignKeySchema} from "./ForeignKeySchema";
import {PrimaryKeySchema} from "./PrimaryKeySchema";
import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {QueryRunner} from "../../query-runner/QueryRunner";
import {ObjectLiteral} from "../../common/ObjectLiteral";
import {EntityMetadata} from "../../metadata/EntityMetadata";

/**
 * Table schema in the database represented in this class.
 */
export class TableSchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table name.
     */
    name: string;

    /**
     * Table columns.
     */
    columns: ColumnSchema[] = [];

    /**
     * Table indices.
     */
    indices: IndexSchema[] = [];

    /**
     * Table foreign keys.
     */
    foreignKeys: ForeignKeySchema[] = [];

    /**
     * Table primary keys.
     */
    primaryKeys: PrimaryKeySchema[] = [];

    /**
     * Indicates if table schema was just created.
     * This is needed, for example to check if we need to skip primary keys creation
     * for new table schemas.
     */
    justCreated: boolean = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, columns?: ColumnSchema[]|ObjectLiteral[], justCreated?: boolean) {
        this.name = name;
        if (columns) {
            this.columns = (columns as any[]).map(column => { // as any[] is a temporary fix (some weird compiler error)
                if (column instanceof ColumnSchema) {
                    return column;
                } else {
                    return new ColumnSchema(column);
                }
            });
        }

        if (justCreated !== undefined)
            this.justCreated = justCreated;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets only those primary keys that does not
     */
    get primaryKeysWithoutGenerated(): PrimaryKeySchema[] {
        const generatedColumn = this.columns.find(column => column.isGenerated);
        if (!generatedColumn)
            return this.primaryKeys;

        return this.primaryKeys.filter(primaryKey => {
            return primaryKey.columnName !== generatedColumn.name;
        });
    }

    get hasGeneratedColumn(): boolean {
        return !!this.columns.find(column => column.isGenerated);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this table schema to a new table schema with all properties cloned.
     */
    clone(): TableSchema {
        const cloned = new TableSchema(this.name);
        cloned.columns = this.columns.map(column => column.clone());
        cloned.indices = this.indices.map(index => index.clone());
        cloned.foreignKeys = this.foreignKeys.map(key => key.clone());
        cloned.primaryKeys = this.primaryKeys.map(key => key.clone());
        return cloned;
    }

    /**
     * Adds column schemas.
     */
    addColumns(columns: ColumnSchema[]) {
        this.columns = this.columns.concat(columns);
    }

    /**
     * Replaces given column.
     */
    replaceColumn(oldColumn: ColumnSchema, newColumn: ColumnSchema) {
        this.columns[this.columns.indexOf(oldColumn)] = newColumn;
    }

    /**
     * Removes a column schema from this table schema.
     */
    removeColumn(columnToRemove: ColumnSchema) {
        const foundColumn = this.columns.find(column => column.name === columnToRemove.name);
        if (foundColumn)
            this.columns.splice(this.columns.indexOf(foundColumn), 1);
    }

    /**
     * Remove all column schemas from this table schema.
     */
    removeColumns(columns: ColumnSchema[]) {
        columns.forEach(column => this.removeColumn(column));
    }

    /**
     * Adds all given primary keys.
     */
    addPrimaryKeys(addedKeys: PrimaryKeySchema[]) {
        addedKeys.forEach(key => this.primaryKeys.push(key));
    }

    /**
     * Removes all given primary keys.
     */
    removePrimaryKeys(droppedKeys: PrimaryKeySchema[]) {
        droppedKeys.forEach(key => {
            this.primaryKeys.splice(this.primaryKeys.indexOf(key), 1);
        });
    }

    /**
     * Removes primary keys of the given columns.
     */
    removePrimaryKeysOfColumns(columns: ColumnSchema[]) {
        this.primaryKeys = this.primaryKeys.filter(primaryKey => {
            return !columns.find(column => column.name === primaryKey.columnName);
        });
    }

    /**
     * Adds foreign key schemas.
     */
    addForeignKeys(foreignKeys: ForeignKeySchema[]) {
        this.foreignKeys = this.foreignKeys.concat(foreignKeys);
    }

    /**
     * Removes foreign key from this table schema.
     */
    removeForeignKey(removedForeignKey: ForeignKeySchema) {
        const fk = this.foreignKeys.find(foreignKey => foreignKey.name === removedForeignKey.name); // this must be by name
        if (fk)
            this.foreignKeys.splice(this.foreignKeys.indexOf(fk), 1);
    }

    /**
     * Removes all foreign keys from this table schema.
     */
    removeForeignKeys(dbForeignKeys: ForeignKeySchema[]) {
        dbForeignKeys.forEach(foreignKey => this.removeForeignKey(foreignKey));
    }

    /**
     * Removes index schema from this table schema.
     */
    removeIndex(indexSchema: IndexSchema) {
        const index = this.indices.find(index => index.name === indexSchema.name);
        if (index)
            this.indices.splice(this.indices.indexOf(index), 1);
    }

    /**
     * Differentiate columns of this table schema and columns from the given column metadatas columns
     * and returns only changed.
     */
    findChangedColumns(queryRunner: QueryRunner, columnMetadatas: ColumnMetadata[]): ColumnSchema[] {
        return this.columns.filter(columnSchema => {
            const columnMetadata = columnMetadatas.find(columnMetadata => columnMetadata.fullName === columnSchema.name);
            if (!columnMetadata)
                return false; // we don't need new columns, we only need exist and changed

            return  columnSchema.name !== columnMetadata.fullName ||
                    columnSchema.type !== queryRunner.normalizeType(columnMetadata) ||
                    columnSchema.comment !== columnMetadata.comment ||
                    (!columnSchema.isGenerated && !queryRunner.compareDefaultValues(columnMetadata.default, columnSchema.default)) || // we included check for generated here, because generated columns already can have default values
                    columnSchema.isNullable !== columnMetadata.isNullable ||
                    columnSchema.isUnique !== columnMetadata.isUnique ||
                    // columnSchema.isPrimary !== columnMetadata.isPrimary ||
                    columnSchema.isGenerated !== columnMetadata.isGenerated;
        });
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates table schema from a given entity metadata.
     *
     * todo: need deeper implementation
     */
    static create(entityMetadata: EntityMetadata, queryRunner: QueryRunner) {
        const tableSchema = new TableSchema(entityMetadata.table.name);
        entityMetadata.columns.forEach(column => {
            tableSchema.columns.push(ColumnSchema.create(column, queryRunner.normalizeType(column)));
        });

        return tableSchema;
    }

}