import {RelationMetadata} from "./RelationMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {JoinColumnMetadataArgs} from "../metadata-args/JoinColumnMetadataArgs";

/**
 * JoinColumnMetadata contains all information about relation's join column.
 */
export class JoinColumnMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Relation - owner of this join column metadata.
     */
    relation: RelationMetadata;

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Join column name.
     */
    private readonly _name: string|undefined;

    /**
     * Join column referenced column name.
     */
    private readonly referencedColumnName: string|undefined;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: JoinColumnMetadataArgs) {
        this.target = args.target;
        this.propertyName = args.propertyName;
        this._name = args.name;
        this.referencedColumnName = args.referencedColumnName;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Join column name.
     */
    get name() {
        return this.relation.entityMetadata.namingStrategy.joinColumnInverseSideName(this._name, this.relation.propertyName);
    }

    /**
     * Referenced join column.
     */
    get referencedColumn(): ColumnMetadata {
        if (this.referencedColumnName) {
            const referencedColumn = this.relation.inverseEntityMetadata.allColumns.find(column => column.fullName === this.referencedColumnName);
            if (!referencedColumn)
                throw new Error(`Referenced column ${this.referencedColumnName} was not found in entity ${this.name}`);
        }

        const inverseEntityMetadata = this.relation.inverseEntityMetadata;
        const primaryColumns = inverseEntityMetadata.primaryColumnsWithParentIdColumns;

        if (primaryColumns.length > 1)
            throw new Error(`Cannot automatically determine a referenced column of the "${inverseEntityMetadata.name}", because it has multiple primary columns. Try to specify a referenced column explicitly.`);

        return primaryColumns[0];
    }

}