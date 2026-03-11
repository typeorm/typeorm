import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { EmbeddedMetadata } from "../../metadata/EmbeddedMetadata"

/**
 * Transforms raw document into entity object.
 * Entity is constructed based on its entity metadata.
 */
export class DocumentToEntityTransformer {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private readonly enableRelationIdValues: boolean = false) {}

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transformAll(documents: ObjectLiteral[], metadata: EntityMetadata) {
        return documents.map((document) => this.transform(document, metadata))
    }

    transform(document: any, metadata: EntityMetadata) {
        const entity: any = metadata.create(undefined, {
            fromDeserializer: true,
        })
        let hasData = false

        // handle _id property the special way
        if (metadata.objectIdColumn) {
            // todo: we can't use driver in this class
            // do we really need prepare hydrated value here? If no then no problem. If yes then think maybe prepareHydratedValue process should be extracted out of driver class?
            // entity[metadata.ObjectIdColumn.propertyName] = this.driver.prepareHydratedValue(document[metadata.ObjectIdColumn.name"], metadata.ObjectIdColumn);
            const { databaseNameWithoutPrefixes, propertyName } =
                metadata.objectIdColumn

            const documentIdWithoutPrefixes =
                document[databaseNameWithoutPrefixes]
            const documentIdWithPropertyName = document[propertyName]

            if (documentIdWithoutPrefixes) {
                entity[propertyName] = documentIdWithoutPrefixes
                hasData = true
            } else if (documentIdWithPropertyName) {
                entity[propertyName] = documentIdWithPropertyName
                hasData = true
            }
        }

        // add special columns that contains relation ids
        if (this.enableRelationIdValues) {
            metadata.columns
                .filter((column) => !!column.relationMetadata)
                .forEach((column) => {
                    const valueInObject =
                        document[column.databaseNameWithoutPrefixes]
                    if (
                        valueInObject !== undefined &&
                        valueInObject !== null &&
                        column.propertyName
                    ) {
                        // todo: we can't use driver in this class
                        // const value = this.driver.prepareHydratedValue(valueInObject, column);
                        entity[column.propertyName] = valueInObject
                        hasData = true
                    }
                })
        }

        /*this.joinMappings
            .filter(joinMapping => joinMapping.parentName === alias.name && !joinMapping.alias.relationOwnerSelection && joinMapping.alias.target)
            .map(joinMapping => {
                const relatedEntities = this.transformRawResultsGroup(rawSqlResults, joinMapping.alias);
                const isResultArray = joinMapping.isMany;
                const result = !isResultArray ? relatedEntities[0] : relatedEntities;

                if (result && (!isResultArray || result.length > 0)) {
                    entity[joinMapping.propertyName] = result;
                    hasData = true;
                }
            });*/

        // get value from columns selections and put them into object
        metadata.ownColumns.forEach((column) => {
            const valueInObject = document[column.databaseNameWithoutPrefixes]
            if (
                valueInObject !== undefined &&
                column.propertyName &&
                !column.isVirtual
            ) {
                // const value = this.driver.prepareHydratedValue(valueInObject, column);

                entity[column.propertyName] = valueInObject
                hasData = true
            }
        })

        const addEmbeddedValuesRecursively = (
            entity: any,
            document: any,
            embeddeds: EmbeddedMetadata[],
        ) => {
            embeddeds.forEach((embedded) => {
                if (!document[embedded.prefix]) return

                if (embedded.isArray) {
                    entity[embedded.propertyName] = (
                        document[embedded.prefix] as any[]
                    ).map((subValue: any, index: number) => {
                        const newItem = embedded.create({
                            fromDeserializer: true,
                        })
                        embedded.columns.forEach((column) => {
                            newItem[column.propertyName] =
                                subValue[column.databaseNameWithoutPrefixes]
                        })
                        addEmbeddedValuesRecursively(
                            newItem,
                            document[embedded.prefix][index],
                            embedded.embeddeds,
                        )
                        return newItem
                    })
                } else {
                    if (
                        embedded.embeddeds.length &&
                        !entity[embedded.propertyName]
                    )
                        entity[embedded.propertyName] = embedded.create({
                            fromDeserializer: true,
                        })

                    embedded.columns.forEach((column) => {
                        const value =
                            document[embedded.prefix][
                                column.databaseNameWithoutPrefixes
                            ]
                        if (value === undefined) return

                        if (!entity[embedded.propertyName])
                            entity[embedded.propertyName] = embedded.create({
                                fromDeserializer: true,
                            })

                        entity[embedded.propertyName][column.propertyName] =
                            value
                    })

                    addEmbeddedValuesRecursively(
                        entity[embedded.propertyName],
                        document[embedded.prefix],
                        embedded.embeddeds,
                    )
                }
            })
        }

        addEmbeddedValuesRecursively(entity, document, metadata.embeddeds)

        return hasData ? entity : null
    }
}
