import { FindManyOptions } from "./FindManyOptions"
import { FindOneOptions } from "./FindOneOptions"
import { SelectQueryBuilder } from "../query-builder/SelectQueryBuilder"
import { FindRelationsNotFoundError } from "../error"
import { EntityMetadata } from "../metadata/EntityMetadata"
import { DriverUtils } from "../driver/DriverUtils"
import { FindTreeOptions } from "./FindTreeOptions"
import { ObjectLiteral } from "../common/ObjectLiteral"
import { RelationMetadata } from "../metadata/RelationMetadata"
import { EntityPropertyNotFoundError } from "../error"

/**
 * Utilities to work with FindOptions.
 */
export class FindOptionsUtils {
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if given object is really instance of FindOneOptions interface.
     */
    static isFindOneOptions<Entity = any>(
        obj: any,
    ): obj is FindOneOptions<Entity> {
        const possibleOptions: FindOneOptions<Entity> = obj
        return (
            possibleOptions &&
            (Array.isArray(possibleOptions.select) ||
                Array.isArray(possibleOptions.relations) ||
                typeof possibleOptions.select === "object" ||
                typeof possibleOptions.relations === "object" ||
                typeof possibleOptions.where === "object" ||
                // typeof possibleOptions.where === "string" ||
                typeof possibleOptions.join === "object" ||
                typeof possibleOptions.order === "object" ||
                typeof possibleOptions.cache === "object" ||
                typeof possibleOptions.cache === "boolean" ||
                typeof possibleOptions.cache === "number" ||
                typeof possibleOptions.comment === "string" ||
                typeof possibleOptions.lock === "object" ||
                typeof possibleOptions.loadRelationIds === "object" ||
                typeof possibleOptions.loadRelationIds === "boolean" ||
                typeof possibleOptions.loadEagerRelations === "boolean" ||
                typeof possibleOptions.withDeleted === "boolean" ||
                typeof possibleOptions.relationLoadStrategy === "string" ||
                typeof possibleOptions.transaction === "boolean")
        )
    }

    /**
     * Checks if given object is really instance of FindManyOptions interface.
     */
    static isFindManyOptions<Entity = any>(
        obj: any,
    ): obj is FindManyOptions<Entity> {
        const possibleOptions: FindManyOptions<Entity> = obj
        return (
            possibleOptions &&
            (this.isFindOneOptions(possibleOptions) ||
                typeof (possibleOptions as FindManyOptions<any>).skip ===
                    "number" ||
                typeof (possibleOptions as FindManyOptions<any>).take ===
                    "number" ||
                typeof (possibleOptions as FindManyOptions<any>).skip ===
                    "string" ||
                typeof (possibleOptions as FindManyOptions<any>).take ===
                    "string")
        )
    }

    /**
     * Checks if given object is really instance of FindOptions interface.
     */
    static extractFindManyOptionsAlias(object: any): string | undefined {
        if (this.isFindManyOptions(object) && object.join)
            return object.join.alias

        return undefined
    }

    static applyOptionsToTreeQueryBuilder<T extends ObjectLiteral>(
        qb: SelectQueryBuilder<T>,
        options?: FindTreeOptions,
    ): SelectQueryBuilder<T> {
        if (options?.relations) {
            // Copy because `applyRelationsRecursively` modifies it
            const allRelations = [...options.relations]

            FindOptionsUtils.applyRelationsRecursively(
                qb,
                allRelations,
                qb.expressionMap.mainAlias!.name,
                qb.expressionMap.mainAlias!.metadata,
                "",
            )

            // recursive removes found relations from allRelations array
            // if there are relations left in this array it means those relations were not found in the entity structure
            // so, we give an exception about not found relations
            if (allRelations.length > 0)
                throw new FindRelationsNotFoundError(allRelations)
        }

        return qb
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Adds joins for all relations and sub-relations of the given relations provided in the find options.
     */
    public static applyRelationsRecursively(
        qb: SelectQueryBuilder<any>,
        allRelations: string[],
        alias: string,
        metadata: EntityMetadata,
        prefix: string,
    ): void {
        // find all relations that match given prefix
        let matchedBaseRelations: RelationMetadata[] = []
        if (prefix) {
            const regexp = new RegExp("^" + prefix.replace(".", "\\.") + "\\.")
            matchedBaseRelations = allRelations
                .filter((relation) => relation.match(regexp))
                .map((relation) =>
                    metadata.findRelationWithPropertyPath(
                        relation.replace(regexp, ""),
                    ),
                )
                .filter((entity) => entity) as RelationMetadata[]
        } else {
            matchedBaseRelations = allRelations
                .map((relation) =>
                    metadata.findRelationWithPropertyPath(relation),
                )
                .filter((entity) => entity) as RelationMetadata[]
        }

        // go through all matched relations and add join for them
        matchedBaseRelations.forEach((relation) => {
            // generate a relation alias
            const relationAlias: string = DriverUtils.buildAlias(
                qb.connection.driver,
                { joiner: "__" },
                alias,
                relation.propertyPath,
            )

            // add a join for the found relation
            const selection = alias + "." + relation.propertyPath
            if (qb.expressionMap.relationLoadStrategy === "query") {
                qb.concatRelationMetadata(relation)
            } else {
                qb.leftJoinAndSelect(selection, relationAlias)
            }

            // remove added relations from the allRelations array, this is needed to find all not found relations at the end
            allRelations.splice(
                allRelations.indexOf(
                    prefix
                        ? prefix + "." + relation.propertyPath
                        : relation.propertyPath,
                ),
                1,
            )

            // try to find sub-relations
            let relationMetadata: EntityMetadata | undefined
            let relationName: string | undefined

            if (qb.expressionMap.relationLoadStrategy === "query") {
                relationMetadata = relation.inverseEntityMetadata
                relationName = relationAlias
            } else {
                const join = qb.expressionMap.joinAttributes.find(
                    (join) => join.entityOrProperty === selection,
                )
                relationMetadata = join!.metadata!
                relationName = join!.alias.name
            }

            if (!relationName || !relationMetadata) {
                throw new EntityPropertyNotFoundError(
                    relation.propertyPath,
                    metadata,
                )
            }

            this.applyRelationsRecursively(
                qb,
                allRelations,
                relationName,
                relationMetadata,
                prefix
                    ? prefix + "." + relation.propertyPath
                    : relation.propertyPath,
            )

            // join the eager relations of the found relation
            // Only supported for "join" relationLoadStrategy
            if (qb.expressionMap.relationLoadStrategy === "join") {
                const relMetadata = metadata.relations.find(
                    (metadata) =>
                        metadata.propertyName === relation.propertyPath,
                )
                if (relMetadata) {
                    this.joinEagerRelations(
                        qb,
                        relationAlias,
                        relMetadata.inverseEntityMetadata,
                    )
                }
            }
        })
    }

    public static joinEagerRelations(
        qb: SelectQueryBuilder<any>,
        alias: string,
        metadata: EntityMetadata,
    ) {
        metadata.eagerRelations.forEach((relation) => {
            // generate a relation alias
            let relationAlias: string = DriverUtils.buildAlias(
                qb.connection.driver,
                { joiner: "__" },
                alias,
                relation.propertyName,
            )

            // add a join for the relation
            // Checking whether the relation wasn't joined yet.
            let addJoin = true
            // TODO: Review this validation
            for (const join of qb.expressionMap.joinAttributes) {
                if (
                    join.hasUserCondition === true ||
                    join.mapToProperty !== undefined ||
                    join.isMappingMany !== undefined ||
                    join.direction !== "LEFT" ||
                    join.entityOrProperty !==
                        `${alias}.${relation.propertyPath}`
                ) {
                    continue
                }
                addJoin = false
                relationAlias = join.alias.name
                break
            }

            const joinAlreadyAdded = Boolean(
                qb.expressionMap.joinAttributes.find(
                    (joinAttribute) =>
                        joinAttribute.alias.name === relationAlias,
                ),
            )

            if (addJoin && !joinAlreadyAdded) {
                qb.leftJoin(alias + "." + relation.propertyPath, relationAlias)
            }

            // Checking whether the relation wasn't selected yet.
            // This check shall be after the join check to detect relationAlias.
            let addSelect = true
            for (const select of qb.expressionMap.selects) {
                if (
                    select.aliasName !== undefined ||
                    select.virtual !== undefined ||
                    select.selection !== relationAlias
                ) {
                    continue
                }
                addSelect = false
                break
            }

            if (addSelect) {
                qb.addSelect(relationAlias)
            }

            // (recursive) join the eager relations
            this.joinEagerRelations(
                qb,
                relationAlias,
                relation.inverseEntityMetadata,
            )
        })
    }
}
