import {RelationTypes, RelationType} from "./types/RelationTypes";
import {EntityMetadata} from "./EntityMetadata";
import {OnDeleteType} from "./ForeignKeyMetadata";
import {JoinTableMetadata} from "./JoinTableMetadata";
import {JoinColumnMetadata} from "./JoinColumnMetadata";
import {RelationMetadataArgs} from "../metadata-args/RelationMetadataArgs";
import {ColumnMetadata} from "./ColumnMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Function that returns a type of the field. Returned value must be a class used on the relation.
 */
export type RelationTypeInFunction = ((type?: any) => Function)|Function|string; // todo: |string ?


/**
 * Contains the name of the property of the object, or the function that returns this name.
 */
export type PropertyTypeInFunction<T> = string|((t: T) => string|any);


/**
 * Contains all information about some entity's relation.
 */
export class RelationMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Its own entity metadata.
     */
    entityMetadata: EntityMetadata;

    /**
     * Related entity metadata.
     */
    inverseEntityMetadata: EntityMetadata;

    /**
     * Junction entity metadata.
     */
    junctionEntityMetadata: EntityMetadata;

    /**
     * Join table metadata.
     */
    joinTable: JoinTableMetadata;

    /**
     * Join column metadata.
     */
    joinColumn: JoinColumnMetadata;

    /**
     * The name of the field that will contain id or ids of this relation. This is used in the case if user
     * wants to save relation without having to load related object, or in the cases if user wants to have id
     * of the object it relates with, but don't want to load that object because of it. Also its used in the
     * cases when user wants to add / remove / load in the many-to-many junction tables.
     */
    idField: string|undefined;

    /**
     * The name of the field that will contain count of the rows of the relation.
     */
    countField: string|undefined;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    /**
     * Indicates if this is a parent (can be only many-to-one relation) relation in the tree tables.
     */
    readonly isTreeParent: boolean = false;

    /**
     * Indicates if this is a children (can be only one-to-many relation) relation in the tree tables.
     */
    readonly isTreeChildren: boolean = false;

    /**
     * Relation type.
     */
    readonly relationType: RelationType;

    /**
     * Indicates if this relation will be a primary key.
     * Can be used only for many-to-one and owner one-to-one relations.
     */
    readonly isPrimary: boolean;

    /**
     * Indicates if this relation will be lazily loaded.
     */
    readonly isLazy: boolean;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    readonly isCascadeInsert: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    readonly isCascadeUpdate: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    readonly isCascadeRemove: boolean;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    readonly isNullable: boolean = true;

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    readonly onDelete: OnDeleteType;

    /**
     * The real reflected property type.
     */
    // readonly propertyType: any;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * The type of the field.
     */
    private _type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    private _inverseSideProperty: PropertyTypeInFunction<any>;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: RelationMetadataArgs) {
        this.target = args.target;
        this.propertyName = args.propertyName;
        this.relationType = args.relationType;

        if (args.inverseSideProperty)
            this._inverseSideProperty = args.inverseSideProperty;
        // if (args.propertyType)
        //     this.propertyType = args.propertyType;
        if (args.isLazy !== undefined)
            this.isLazy = args.isLazy;
        if (args.options.cascadeInsert || args.options.cascadeAll)
            this.isCascadeInsert = true;
        if (args.options.cascadeUpdate || args.options.cascadeAll)
            this.isCascadeUpdate = true;
        if (args.options.cascadeRemove || args.options.cascadeAll)
            this.isCascadeRemove = true;
        if (args.options.nullable !== undefined)
            this.isNullable = args.options.nullable;
        if (args.options.onDelete)
            this.onDelete = args.options.onDelete;
        if (args.options.primary !== undefined)
            this.isPrimary = args.options.primary;
        if (args.isTreeParent)
            this.isTreeParent = true;
        if (args.isTreeChildren)
            this.isTreeChildren = true;

        if (!this._type)
            this._type = args.type;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Gets relation's entity target.
     * Original target returns target of the class where relation is.
     * This class can be an abstract class, but relation even is from that class,
     * but its more related to a specific entity. That's why we need this field.
     */
    get entityTarget(): Function|string {
        return this.entityMetadata.target;
    }

    /**
     * Gets the name of column in the database.
     * //Cannot be used with many-to-many relations since they don't have a column in the database.
     * //Also only owning sides of the relations have this property.
     */
    get name(): string {
        // if (!this.isOwning || this.isManyToMany)

        if (this.isOwning) {
            if (this.joinTable) {
                return this.joinTable.joinColumnName;
            } else if (this.joinColumn) {
                return this.joinColumn.name;
            }

        } else if (this.hasInverseSide) {
            if (this.inverseRelation.joinTable) {
                return this.inverseRelation.joinTable.inverseJoinColumnName;
            } else if (this.inverseRelation.joinColumn && this.inverseRelation.joinColumn.referencedColumn) {
                return this.inverseRelation.joinColumn.referencedColumn.fullName;
            }
        }

        throw new Error(`Relation name cannot be retrieved.`);
    }

    /**
     * Gets the name of column to which this relation is referenced.
     * //Cannot be used with many-to-many relations since all referenced are in the junction table.
     * //Also only owning sides of the relations have this property.
     */
    get referencedColumnName(): string {
        // if (!this.isOwning)
        //     throw new Error(`Only owning side of the relations can have information about referenced column names.`);

        // for many-to-one and owner one-to-one relations we get referenced column from join column
        /*if (this.joinColumn && this.joinColumn.referencedColumn && this.joinColumn.referencedColumn.name)
            return this.joinColumn.referencedColumn.name;

        // for many-to-many relation we give referenced column depend of owner side
        if (this.joinTable) { // need to check if this algorithm works correctly
            if (this.isOwning) {
                return this.joinTable.referencedColumn.name;
            } else {
                return this.joinTable.inverseReferencedColumn.name;
            }
        }*/

        if (this.isOwning) {
            if (this.joinTable) {
                return this.joinTable.referencedColumn.fullName;

            } else if (this.joinColumn) {
                return this.joinColumn.referencedColumn.fullName;
            }

        } else if (this.hasInverseSide) {
            if (this.inverseRelation.joinTable) {
                return this.inverseRelation.joinTable.inverseReferencedColumn.fullName;
            } else if (this.inverseRelation.joinColumn) {
                return this.inverseRelation.joinColumn.name; // todo: didn't get this logic here
            }
        }

        // this should not be possible, but anyway throw error
        throw new Error(`Cannot get referenced column name of the relation ${this.entityMetadata.name}#${this.name}`);
    }

    /**
     * Gets the column to which this relation is referenced.
     */
    get referencedColumn(): ColumnMetadata {
        if (this.isOwning) {
            if (this.joinTable) {
                return this.joinTable.referencedColumn;

            } else if (this.joinColumn) {
                return this.joinColumn.referencedColumn;
            }

        } else if (this.hasInverseSide) {
            if (this.inverseRelation.joinTable) {
                return this.inverseRelation.joinTable.inverseReferencedColumn;
            } else if (this.inverseRelation.joinColumn) {
                return this.inverseRelation.joinColumn.referencedColumn;
            }
        }

        // this should not be possible, but anyway throw error
        throw new Error(`Cannot get referenced column of the relation ${this.entityMetadata.name}#${this.name}`);
    }

    /**
     * Gets the property's type to which this relation is applied.
     */
    get type(): Function|string { // todo: when this can be a string?
        return this._type instanceof Function ? (this._type as () => any)() : this._type;
    }

    /**
     * Indicates if this side is an owner of this relation.
     */
    get isOwning() {
        return  !!(this.isManyToOne ||
                (this.isManyToMany && this.joinTable) ||
                (this.isOneToOne && this.joinColumn));
    }

    /**
     * Checks if this relation's type is "one-to-one".
     */
    get isOneToOne(): boolean {
        return this.relationType === RelationTypes.ONE_TO_ONE;
    }

    /**
     * Checks if this relation is owner side of the "one-to-one" relation.
     * Owner side means this side of relation has a join column in the table.
     */
    get isOneToOneOwner(): boolean {
        return this.isOneToOne && this.isOwning;
    }

    /**
     * Checks if this relation is NOT owner side of the "one-to-one" relation.
     * NOT owner side means this side of relation does not have a join column in the table.
     */
    get isOneToOneNotOwner(): boolean {
        return this.isOneToOne && !this.isOwning;
    }

    /**
     * Checks if this relation's type is "one-to-many".
     */
    get isOneToMany(): boolean {
        return this.relationType === RelationTypes.ONE_TO_MANY;
    }

    /**
     * Checks if this relation's type is "many-to-one".
     */
    get isManyToOne(): boolean {
        return this.relationType === RelationTypes.MANY_TO_ONE;
    }

    /**
     * Checks if this relation's type is "many-to-many".
     */
    get isManyToMany(): boolean {
        return this.relationType === RelationTypes.MANY_TO_MANY;
    }

    /**
     * Checks if this relation's type is "many-to-many", and is owner side of the relationship.
     * Owner side means this side of relation has a join table.
     */
    get isManyToManyOwner(): boolean {
        return this.isManyToMany && this.isOwning;
    }

    /**
     * Checks if this relation's type is "many-to-many", and is NOT owner side of the relationship.
     * Not owner side means this side of relation does not have a join table.
     */
    get isManyToManyNotOwner(): boolean {
        return this.isManyToMany && !this.isOwning;
    }

    /**
     * Checks if inverse side is specified by a relation.
     */
    get hasInverseSide(): boolean {
        return this.inverseEntityMetadata && this.inverseEntityMetadata.hasRelationWithPropertyName(this.inverseSideProperty);
    }

    /**
     * Gets the property name of the inverse side of the relation.
     */
    get inverseSideProperty(): string { // todo: should be called inverseSidePropertyName ?

        if (this._inverseSideProperty) {
            return this.computeInverseSide(this._inverseSideProperty);

        } else if (this.isTreeParent && this.entityMetadata.hasTreeChildrenRelation) {
            return this.entityMetadata.treeChildrenRelation.propertyName;

        } else if (this.isTreeChildren && this.entityMetadata.hasTreeParentRelation) {
            return this.entityMetadata.treeParentRelation.propertyName;

        }

        return "";
    }

    /**
     * Gets the relation metadata of the inverse side of this relation.
     */
    get inverseRelation(): RelationMetadata {
        const relation = this.inverseEntityMetadata.findRelationWithPropertyName(this.inverseSideProperty);
        if (!relation)
            throw new Error(`Inverse side was not found in the relation ${this.entityMetadata.name}#${this.inverseSideProperty}`);

        return relation;
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Gets given entity's relation's value.
     * Using of this method helps to access value of the lazy loaded relation.
     */
    getEntityValue(entity: ObjectLiteral): any {
        return this.isLazy ? entity["__" + this.propertyName + "__"] : entity[this.propertyName];
    }

    /**
     * Checks if given entity has a value in a relation.
     */
    hasEntityValue(entity: ObjectLiteral): boolean {
        return this.isLazy ? entity["__" + this.propertyName + "__"] : entity[this.propertyName];
    }

    /**
     * todo: lazy relations are not supported here? implement logic?
     *
     * examples:
     *
     * - isOneToOneNotOwner or isOneToMany:
     *  Post has a Category.
     *  Post is owner side.
     *  Category is inverse side.
     *  Post.category is mapped to Category.id
     *
     *  if from Post relation we are passing Category here,
     *  it should return a post.category
     */
    getOwnEntityRelationId(ownEntity: ObjectLiteral): any {
        if (this.isManyToManyOwner) {
            return ownEntity[this.joinTable.referencedColumn.propertyName];

        } else if (this.isManyToManyNotOwner) {
            return ownEntity[this.inverseRelation.joinTable.inverseReferencedColumn.propertyName];

        } else if (this.isOneToOneOwner || this.isManyToOne) {
            return ownEntity[this.joinColumn.propertyName];

        } else if (this.isOneToOneNotOwner || this.isOneToMany) {
            return ownEntity[this.inverseRelation.joinColumn.referencedColumn.propertyName];
        }
    }

    /**
     *
     * examples:
     *
     * - isOneToOneNotOwner or isOneToMany:
     *  Post has a Category.
     *  Post is owner side.
     *  Category is inverse side.
     *  Post.category is mapped to Category.id
     *
     *  if from Post relation we are passing Category here,
     *  it should return a category.id
     *
     *  @deprecated Looks like this method does not make sence and does same as getOwnEntityRelationId ?
     */
    getInverseEntityRelationId(inverseEntity: ObjectLiteral): any {
        if (this.isManyToManyOwner) {
            return inverseEntity[this.joinTable.inverseReferencedColumn.propertyName];

        } else if (this.isManyToManyNotOwner) {
            return inverseEntity[this.inverseRelation.joinTable.referencedColumn.propertyName];

        } else if (this.isOneToOneOwner || this.isManyToOne) {
            return inverseEntity[this.joinColumn.referencedColumn.propertyName];

        } else if (this.isOneToOneNotOwner || this.isOneToMany) {
            return inverseEntity[this.inverseRelation.joinColumn.propertyName];
        }
    }

    // ---------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------

    /**
     * Inverse side set in the relation can be either string - property name of the column on inverse side,
     * either can be a function that accepts a map of properties with the object and returns one of them.
     * Second approach is used to achieve type-safety.
     */
    private computeInverseSide(inverseSide: PropertyTypeInFunction<any>): string {
        const ownerEntityPropertiesMap = this.inverseEntityMetadata.createPropertiesMap();
        if (typeof inverseSide === "function")
            return (<Function> inverseSide)(ownerEntityPropertiesMap);
        if (typeof inverseSide === "string")
            return <string> inverseSide;

        // throw new Error("Cannot compute inverse side of the relation");
        return "";
    }
}