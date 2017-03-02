import {EntityMetadata} from "./EntityMetadata";
import {TableMetadata} from "./TableMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {EmbeddedMetadataArgs} from "../metadata-args/EmbeddedMetadataArgs";

/**
 * Contains all information about entity's embedded property.
 */
export class EmbeddedMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Its own entity metadata.
     */
    entityMetadata: EntityMetadata;

    /**
     * Parent embedded in the case if this embedded inside other embedded.
     */
    parentEmbeddedMetadata: EmbeddedMetadata;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Property name on which this embedded is attached.
     */
    readonly propertyName: string;

    /**
     * Embeddable table.
     */
    readonly table: TableMetadata;

    /**
     * Embeddable table's columns.
     */
    readonly columns: ColumnMetadata[];

    /**
     * Nested embeddable in this embeddable.
     */
    readonly embeddeds: EmbeddedMetadata[];

    /**
     * Embedded type.
     */
    readonly type?: Function;

    /**
     * Indicates if this embedded is in array mode.
     */
    readonly isArray: boolean;

    /**
     * Prefix of the embedded, used instead of propertyName.
     * If set to empty string, then prefix is not set at all.
     */
    readonly customPrefix: string|undefined;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(table: TableMetadata,
                columns: ColumnMetadata[],
                embeddeds: EmbeddedMetadata[],
                args: EmbeddedMetadataArgs) {
        this.type = args.type ? args.type() : undefined;
        this.propertyName = args.propertyName;
        this.isArray = args.isArray;
        this.customPrefix = args.prefix;
        this.table = table;
        this.columns = columns;
        this.embeddeds = embeddeds;
        this.embeddeds.forEach(embedded => {
            embedded.parentEmbeddedMetadata = this;
        });
        this.columns.forEach(column => {
            column.embeddedMetadata = this;
        });
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Creates a new embedded object.
     */
    create() {
        if (!this.type)
            throw new Error(`Embedded cannot be created because it does not have a type set.`);

        return new (this.type as any);
    }

    /**
     * Gets the prefix of the columns.
     * By default its a property name of the class where this prefix is.
     * But if custom prefix is set then it takes its value as a prefix.
     * However if custom prefix is set to empty string prefix to column is not applied at all.
     */
    get prefix() {
        if (this.customPrefix !== undefined)
            return this.customPrefix;

        return this.propertyName;
    }

}