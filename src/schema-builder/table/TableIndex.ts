import {IndexMetadata} from "../../metadata/IndexMetadata";
import {TableIndexOptions} from "../options/TableIndexOptions";
import {IndexOrderOptions} from "../../metadata/types/IndexOrderOptions";

/**
 * Database's table index stored in this class.
 */
export class TableIndex {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Index name.
     */
    name?: string;

    /**
     * Columns included in this index.
     */
    columnNames: string[] = [];

    /**
     * Indicates if this index is unique.
     */
    isUnique: boolean;

    /**
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL.
     */
    isSpatial: boolean;

    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Works only in MySQL.
     */
    isFulltext: boolean;

    /**
     * Fulltext parser.
     * Works only in MySQL.
     */
    parser?: string;

    /**
     * Index filter condition.
     */
    where: string;

    /**
     * Specifies a sort order used in index creation.
     */
    orderBy?: IndexOrderOptions;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableIndexOptions) {
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.isUnique = !!options.isUnique;
        this.isSpatial = !!options.isSpatial;
        this.isFulltext = !!options.isFulltext;
        this.parser = options.parser;
        this.where = options.where ? options.where : "";
        this.orderBy = options.orderBy;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this index with exactly same properties.
     */
    clone(): TableIndex {
        return new TableIndex(<TableIndexOptions>{
            name: this.name,
            columnNames: [...this.columnNames],
            isUnique: this.isUnique,
            isSpatial: this.isSpatial,
            isFulltext: this.isFulltext,
            parser: this.parser,
            where: this.where,
            orderBy: this.orderBy
        });
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates index from the index metadata object.
     */
    static create(indexMetadata: IndexMetadata): TableIndex {
        return new TableIndex(<TableIndexOptions>{
            name: indexMetadata.name,
            columnNames: indexMetadata.columns.map(column => column.databaseName),
            isUnique: indexMetadata.isUnique,
            isSpatial: indexMetadata.isSpatial,
            isFulltext: indexMetadata.isFulltext,
            parser: indexMetadata.parser,
            where: indexMetadata.where,
            orderBy: indexMetadata.orderBy
        });
    }

}
