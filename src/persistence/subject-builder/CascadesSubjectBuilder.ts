import { Subject } from "../Subject"
import type { ObjectLiteral } from "../../common/ObjectLiteral"
import { ObjectUtils } from "../../util/ObjectUtils"

/**
 * Finds all cascade operations of the given subject and cascade operations of the found cascaded subjects,
 * e.g. builds a cascade tree and creates a subjects for them.
 */
export class CascadesSubjectBuilder {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(protected allSubjects: Subject[]) {}

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Builds a cascade subjects tree and pushes them in into the given array of subjects.
     *
     * @param subject
     * @param operationType
     */
    build(
        subject: Subject,
        operationType: "save" | "remove" | "soft-remove" | "recover",
    ) {
        subject.metadata
            .extractRelationValuesFromEntity(
                subject.entity!,
                subject.metadata.relations,
            ) // todo: we can create EntityMetadata.cascadeRelations
            .forEach(([relation, relationEntity, relationEntityMetadata]) => {
                // skip undefined/null values and relations whose cascade flags
                // don't match the current operation type
                if (relationEntity === undefined || relationEntity === null)
                    return

                let shouldCascade: boolean
                switch (operationType) {
                    case "save":
                        shouldCascade =
                            relation.isCascadeInsert || relation.isCascadeUpdate
                        break
                    case "remove":
                        shouldCascade = relation.isCascadeRemove
                        break
                    case "soft-remove":
                        shouldCascade = relation.isCascadeSoftRemove
                        break
                    case "recover":
                        shouldCascade = relation.isCascadeRecover
                        break
                    default:
                        shouldCascade = false
                }

                if (!shouldCascade) return

                // if relation entity is just a relation id set (for example post.tag = 1)
                // then we don't really need to check cascades since there is no object to insert or update
                if (!ObjectUtils.isObject(relationEntity)) return

                // if we already has this entity in list of operated subjects then skip it to avoid recursion
                const alreadyExistRelationEntitySubject =
                    this.findByPersistEntityLike(
                        relationEntityMetadata.target,
                        relationEntity,
                    )
                if (alreadyExistRelationEntitySubject) {
                    if (
                        alreadyExistRelationEntitySubject.canBeInserted ===
                        false
                    )
                        alreadyExistRelationEntitySubject.canBeInserted =
                            relation.isCascadeInsert === true &&
                            operationType === "save"
                    if (
                        alreadyExistRelationEntitySubject.canBeUpdated === false
                    )
                        alreadyExistRelationEntitySubject.canBeUpdated =
                            relation.isCascadeUpdate === true &&
                            operationType === "save"
                    if (!alreadyExistRelationEntitySubject.mustBeRemoved)
                        alreadyExistRelationEntitySubject.mustBeRemoved =
                            relation.isCascadeRemove === true &&
                            operationType === "remove" &&
                            !!alreadyExistRelationEntitySubject.identifier
                    if (
                        alreadyExistRelationEntitySubject.canBeSoftRemoved ===
                        false
                    )
                        alreadyExistRelationEntitySubject.canBeSoftRemoved =
                            relation.isCascadeSoftRemove === true &&
                            operationType === "soft-remove"
                    if (
                        alreadyExistRelationEntitySubject.canBeRecovered ===
                        false
                    )
                        alreadyExistRelationEntitySubject.canBeRecovered =
                            relation.isCascadeRecover === true &&
                            operationType === "recover"
                    return
                }

                // mark subject with what we can do with it
                // and add to the array of subjects to load only if there is no same entity there already
                const relationEntitySubject = new Subject({
                    metadata: relationEntityMetadata,
                    parentSubject: subject,
                    entity: relationEntity,
                    canBeInserted:
                        relation.isCascadeInsert === true &&
                        operationType === "save",
                    canBeUpdated:
                        relation.isCascadeUpdate === true &&
                        operationType === "save",
                    canBeSoftRemoved:
                        relation.isCascadeSoftRemove === true &&
                        operationType === "soft-remove",
                    canBeRecovered:
                        relation.isCascadeRecover === true &&
                        operationType === "recover",
                })

                // only mark for removal if the subject has an identifier,
                // otherwise SubjectExecutor will throw SubjectWithoutIdentifierError
                if (
                    relation.isCascadeRemove === true &&
                    operationType === "remove" &&
                    relationEntitySubject.identifier
                ) {
                    relationEntitySubject.mustBeRemoved = true
                }

                this.allSubjects.push(relationEntitySubject)

                // go recursively and find other entities we need to insert/update
                this.build(relationEntitySubject, operationType)
            })
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    /**
     * Finds subject where entity like given subject's entity.
     * Comparison made by entity id.
     *
     * @param entityTarget
     * @param entity
     */
    protected findByPersistEntityLike(
        entityTarget: Function | string,
        entity: ObjectLiteral,
    ): Subject | undefined {
        return this.allSubjects.find((subject) => {
            if (!subject.entity) return false

            if (subject.entity === entity) return true

            return (
                subject.metadata.target === entityTarget &&
                subject.metadata.compareEntities(
                    subject.entityWithFulfilledIds!,
                    entity,
                )
            )
        })
    }
}
