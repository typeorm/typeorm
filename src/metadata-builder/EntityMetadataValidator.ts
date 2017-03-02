import {UsingJoinTableIsNotAllowedError} from "./error/UsingJoinTableIsNotAllowedError";
import {UsingJoinTableOnlyOnOneSideAllowedError} from "./error/UsingJoinTableOnlyOnOneSideAllowedError";
import {UsingJoinColumnIsNotAllowedError} from "./error/UsingJoinColumnIsNotAllowedError";
import {UsingJoinColumnOnlyOnOneSideAllowedError} from "./error/UsingJoinColumnOnlyOnOneSideAllowedError";
import {MissingJoinColumnError} from "./error/MissingJoinColumnError";
import {MissingJoinTableError} from "./error/MissingJoinTableError";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {MissingPrimaryColumnError} from "./error/MissingPrimaryColumnError";
import {CircularRelationsError} from "./error/CircularRelationsError";
import {DepGraph} from "../util/DepGraph";

/// todo: add check if there are multiple tables with the same name
/// todo: add checks when generated column / table names are too long for the specific driver

/**
 * Validates built entity metadatas.
 */
export class EntityMetadataValidator {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Validates all given entity metadatas.
     */
    validateMany(entityMetadatas: EntityMetadata[]) {
        entityMetadatas.forEach(entityMetadata => this.validate(entityMetadata, entityMetadatas));
        this.validateDependencies(entityMetadatas);
    }

    /**
     * Validates given entity metadata.
     */
    validate(entityMetadata: EntityMetadata, allEntityMetadatas: EntityMetadata[]) {

        // check if table metadata has an id
        if (!entityMetadata.table.isClassTableChild && !entityMetadata.primaryColumns.length && !entityMetadata.junction)
            throw new MissingPrimaryColumnError(entityMetadata);

        // validate if table is using inheritance it has a discriminator
        // also validate if discriminator values are not empty and not repeated
        if (entityMetadata.inheritanceType === "single-table") {
            if (!entityMetadata.hasDiscriminatorColumn)
                throw new Error(`Entity ${entityMetadata.name} using single-table inheritance, it should also have a discriminator column. Did you forget to put @DiscriminatorColumn decorator?`);

            if (["", undefined, null].indexOf(entityMetadata.discriminatorValue) !== -1)
                throw new Error(`Entity ${entityMetadata.name} has empty discriminator value. Discriminator value should not be empty.`);

            const sameDiscriminatorValueEntityMetadata = allEntityMetadatas.find(metadata => {
                return metadata !== entityMetadata && metadata.discriminatorValue === entityMetadata.discriminatorValue;
            });
            if (sameDiscriminatorValueEntityMetadata)
                throw new Error(`Entities ${entityMetadata.name} and ${sameDiscriminatorValueEntityMetadata.name} as equal discriminator values. Make sure their discriminator values are not equal using @DiscriminatorValue decorator.`);
        }

        // validate relations
        entityMetadata.relations.forEach(relation => {

            // check join tables:
            // using JoinTable is possible only on one side of the many-to-many relation
            if (relation.joinTable) {
                if (!relation.isManyToMany)
                    throw new UsingJoinTableIsNotAllowedError(entityMetadata, relation);

                // if there is inverse side of the relation, then check if it does not have join table too
                if (relation.hasInverseSide && relation.inverseRelation.joinTable)
                    throw new UsingJoinTableOnlyOnOneSideAllowedError(entityMetadata, relation);
            }

            // check join columns:
            // using JoinColumn is possible only on one side of the relation and on one-to-one, many-to-one relation types
            // first check if relation is one-to-one or many-to-one
            if (relation.joinColumn) {

                // join column can be applied only on one-to-one and many-to-one relations
                if (!relation.isOneToOne && !relation.isManyToOne)
                    throw new UsingJoinColumnIsNotAllowedError(entityMetadata, relation);

                // if there is inverse side of the relation, then check if it does not have join table too
                if (relation.hasInverseSide && relation.inverseRelation.joinColumn && relation.isOneToOne)
                    throw new UsingJoinColumnOnlyOnOneSideAllowedError(entityMetadata, relation);

                // check if join column really has referenced column
                if (relation.joinColumn && !relation.joinColumn.referencedColumn)
                    throw new Error(`Join column does not have referenced column set`);

            }

            // if its a one-to-one relation and JoinColumn is missing on both sides of the relation
            // or its one-side relation without JoinColumn we should give an error
            if (!relation.joinColumn && relation.isOneToOne && (!relation.hasInverseSide || !relation.inverseRelation.joinColumn))
                throw new MissingJoinColumnError(entityMetadata, relation);

            // if its a many-to-many relation and JoinTable is missing on both sides of the relation
            // or its one-side relation without JoinTable we should give an error
            if (!relation.joinTable && relation.isManyToMany && (!relation.hasInverseSide || !relation.inverseRelation.joinTable))
                throw new MissingJoinTableError(entityMetadata, relation);


            // todo: validate if its one-to-one and side which does not have join column MUST have inverse side
            // todo: validate if its many-to-many and side which does not have join table MUST have inverse side
            // todo: if there is a relation, and inverse side is specified only on one side, shall we give error
            // todo: with message like: "Inverse side is specified only on one side of the relationship. Specify on other side too to prevent confusion".
            // todo: add validation if there two entities with the same target, and show error message with description of the problem (maybe file was renamed/moved but left in output directory)
            // todo: check if there are multiple columns on the same column applied.
            // todo: check column type if is missing in relational databases (throw new Error(`Column type of ${type} cannot be determined.`);)
            // todo: include driver-specific checks. for example in mongodb empty prefixes are not allowed

        });

        // make sure cascade remove is not set for both sides of relationships (can be set in OneToOne decorators)
        entityMetadata.relations.forEach(relation => {
            const isCircularCascadeRemove = relation.isCascadeRemove && relation.hasInverseSide && relation.inverseRelation.isCascadeRemove;
            if (isCircularCascadeRemove)
                throw new Error(`Relation ${entityMetadata.name}#${relation.propertyName} and ${relation.inverseRelation.entityMetadata.name}#${relation.inverseRelation.propertyName} both has cascade remove set. ` +
                    `This may lead to unexpected circular removals. Please set cascade remove only from one side of relationship.`);
        }); // todo: maybe better just deny removal from one to one relation without join column?
    }

    /**
     * Validates dependencies of the entity metadatas.
     */
    protected validateDependencies(entityMetadatas: EntityMetadata[]) {

        const graph = new DepGraph();
        entityMetadatas.forEach(entityMetadata => {
            graph.addNode(entityMetadata.name);
        });
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.relationsWithJoinColumns
                .filter(relation => !relation.isNullable)
                .forEach(relation => {
                    graph.addDependency(entityMetadata.name, relation.inverseEntityMetadata.name);
                });
        });
        try {
            graph.overallOrder();

        } catch (err) {
            throw new CircularRelationsError(err.toString().replace("Error: Dependency Cycle Found: ", ""));
        }
    }

}