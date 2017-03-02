import {RelationMetadata} from "./RelationMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {JoinTableMetadataArgs} from "../metadata-args/JoinTableMetadataArgs";

/**
 * JoinTableMetadata contains all information about relation's join table.
 */
export class JoinTableMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Relation - owner of this join table metadata.
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
     * Join table name.
     */
    private readonly _name?: string;

    /**
     * Join column name.
     */
    private readonly _joinColumnName: string;

    /**
     * Join column referenced column name.
     */
    private readonly _joinColumnReferencedColumnName: string;

    /**
     * Join column name of the inverse side.
     */
    private readonly _inverseJoinColumnName: string;

    /**
     * Join column referenced column name of the inverse side.
     */
    private readonly _inverseJoinColumnReferencedColumnName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: JoinTableMetadataArgs) {
        this.target = args.target;
        this.propertyName = args.propertyName;
        this._name = args.name;

        if (args.joinColumn) {
            if (args.joinColumn.name)
                this._joinColumnName = args.joinColumn.name;
            if (args.joinColumn.referencedColumnName)
                this._joinColumnReferencedColumnName = args.joinColumn.referencedColumnName;
        }

        if (args.inverseJoinColumn) {
            if (args.inverseJoinColumn.name)
                this._inverseJoinColumnName = args.inverseJoinColumn.name;
            if (args.inverseJoinColumn.referencedColumnName)
                this._inverseJoinColumnReferencedColumnName = args.inverseJoinColumn.referencedColumnName;
        }
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Join table name.
     */
    get name() {
        if (this._name)
            return this._name;

        return this.relation.entityMetadata.namingStrategy.joinTableName(
            this.relation.entityMetadata.table.nameWithoutPrefix,
            this.relation.inverseEntityMetadata.table.nameWithoutPrefix,
            this.relation.propertyName,
            this.relation.hasInverseSide ? this.relation.inverseRelation.propertyName : "",
            this.referencedColumn.fullName,
            this.inverseReferencedColumn.fullName
        );
    }

    /**
     * Join column name.
     */
    get joinColumnName() {
        if (this._joinColumnName)
            return this._joinColumnName;

        return this.relation
            .entityMetadata
            .namingStrategy
            .joinTableColumnName(
                this.relation.entityMetadata.table.nameWithoutPrefix,
                this.referencedColumn.fullName,
                this.relation.inverseEntityMetadata.table.nameWithoutPrefix,
                this.inverseReferencedColumn.fullName
            );
    }

    /**
     * Join column name of the inverse side.
     */
    get inverseJoinColumnName() {
        if (this._inverseJoinColumnName)
            return this._inverseJoinColumnName;

        return this.relation
            .entityMetadata
            .namingStrategy
            .joinTableInverseColumnName(
                this.relation.inverseEntityMetadata.table.nameWithoutPrefix,
                this.inverseReferencedColumn.fullName,
                this.relation.entityMetadata.table.nameWithoutPrefix,
                this.referencedColumn.fullName
            );
    }

    /**
     * Referenced join column.
     */
    get referencedColumn(): ColumnMetadata {
        if (this._joinColumnReferencedColumnName) {
            const referencedColumn = this.relation.entityMetadata.columns.find(column => column.fullName === this._joinColumnReferencedColumnName);
            if (!referencedColumn)
                throw new Error(`Referenced column ${this._joinColumnReferencedColumnName} was not found in entity ${this.name}`);

            return referencedColumn;
        }

        if (this.relation.entityMetadata.primaryColumns.length > 1)
            throw new Error(`Cannot automatically determine a referenced column of the "${this.relation.entityMetadata.name}", because it has multiple primary columns. Try to specify a referenced column explicitly.`);

        return this.relation.entityMetadata.firstPrimaryColumn;
    }

    /**
     * Referenced join column of the inverse side.
     */
    get inverseReferencedColumn(): ColumnMetadata {
        if (this._inverseJoinColumnReferencedColumnName) {
            const referencedColumn = this.relation.inverseEntityMetadata.columns.find(column => column.fullName === this._inverseJoinColumnReferencedColumnName);
            if (!referencedColumn)
                throw new Error(`Referenced column ${this._inverseJoinColumnReferencedColumnName} was not found in entity ${this.name}`);

            return referencedColumn;
        }

        if (this.relation.inverseEntityMetadata.primaryColumns.length > 1)
            throw new Error(`Cannot automatically determine inverse referenced column of the "${this.relation.inverseEntityMetadata.name}", because it has multiple primary columns. Try to specify a referenced column explicitly.`);

        return this.relation.inverseEntityMetadata.firstPrimaryColumn;
    }

}