import {EntityMetadata} from "../../metadata/EntityMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 */
export class PlainObjectToNewEntityTransformer {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    transform<T>(newEntity: T, object: ObjectLiteral, metadata: EntityMetadata): T {
        // console.log("groupAndTransform entity:", newEntity);
        // console.log("groupAndTransform object:", object);
        this.groupAndTransform(newEntity, object, metadata);
        // console.log("result:", newEntity);
        return newEntity;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    private groupAndTransform(entity: ObjectLiteral, object: ObjectLiteral, metadata: EntityMetadata): void {

        // console.log("groupAndTransform entity:", entity);
        // console.log("groupAndTransform object:", object);

        // copy regular column properties from the given object
        metadata.columns.forEach(column => {
            if (column.isVirtual) // we don't need to merge virtual columns
                return;

            const objectColumnValue = column.getEntityValue(object);
            if (objectColumnValue !== undefined)
                column.setEntityValue(entity, objectColumnValue);
        });

        // // copy relation properties from the given object
        metadata.relations.forEach(relation => {

            let entityRelatedValue = relation.getEntityValue(entity);
            const objectRelatedValue = relation.getEntityValue(object);
            if (objectRelatedValue === undefined)
                return;

            if (relation.isOneToMany || relation.isManyToMany) {
                if (!(objectRelatedValue instanceof Array))
                    return;

                if (!entityRelatedValue) {
                    entityRelatedValue = [];
                    relation.setEntityValue(entity, entityRelatedValue);
                }

                objectRelatedValue.forEach(objectRelatedValueItem => {

                    // check if we have this item from the merging object in the original entity we merge into
                    let objectRelatedValueEntity = (entityRelatedValue as any[]).find(entityRelatedValueItem => {
                        return relation.inverseEntityMetadata.compareEntities(objectRelatedValueItem, entityRelatedValueItem);
                    });

                    // if such item already exist then merge new data into it, if its not we create a new entity and merge it into the array
                    if (!objectRelatedValueEntity) {
                        objectRelatedValueEntity = relation.inverseEntityMetadata.create();
                        entityRelatedValue.push(objectRelatedValueEntity);
                    }

                    this.groupAndTransform(objectRelatedValueEntity, objectRelatedValueItem, relation.inverseEntityMetadata);
                });

            } else {

                // if related object isn't an object (direct relation id for example)
                // we just set it to the entity relation, we don't need anything more from it
                // however we do it only if original entity does not have this relation set to object
                // to prevent full overriding of objects
                if (!(objectRelatedValue instanceof Object)) {
                    if (!(entityRelatedValue instanceof Object))
                        relation.setEntityValue(entity, objectRelatedValue);
                    return;
                }

                if (!entityRelatedValue) {
                    entityRelatedValue = relation.inverseEntityMetadata.create();
                    relation.setEntityValue(entity, entityRelatedValue);
                }

                this.groupAndTransform(entityRelatedValue, objectRelatedValue, relation.inverseEntityMetadata);
            }


            /*const propertyName = relation.isLazy ? "__" + relation.propertyName + "__" : relation.propertyName;
            const value = relation.getEntityValue(object);
            if (value === undefined)
                return;

            if (relation.embeddedMetadata) {

                // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
                const extractEmbeddedColumnValue = (embeddedMetadatas: EmbeddedMetadata[], map: ObjectLiteral): any => {

                    const embeddedMetadata = embeddedMetadatas.shift();
                    if (embeddedMetadata) {
                        if (!map[embeddedMetadata.propertyName])
                            map[embeddedMetadata.propertyName] = embeddedMetadata.create();

                        extractEmbeddedColumnValue(embeddedMetadatas, map[embeddedMetadata.propertyName]);
                        return map;
                    }

                    map[propertyName] = this.groupAndTransform(map[propertyName], value, relation.inverseEntityMetadata);
                    return map;
                };
                entity[propertyName] = extractEmbeddedColumnValue([...relation.embeddedMetadata.embeddedMetadataTree], entity);

            } else {
                if (value instanceof Array) {
                    if (!entity[propertyName]) entity[propertyName] = [];

                    entity[propertyName] = value.map(subValue => {
                        return this.groupAndTransform(entity[propertyName], subValue, relation.inverseEntityMetadata);
                    });
                } else {
                    if (value instanceof Object) {
                        entity[propertyName] = this.groupAndTransform(entity[propertyName], value, relation.inverseEntityMetadata);

                    } else {
                        entity[propertyName] = value;
                    }
                }
            }*/

            // const objectRelationValue = relation.getEntityValue(object);
            // if (objectRelationValue !== undefined)
            //     relation.setEntityValue(entity, objectRelationValue, true);
        });

        // copy regular column properties from the given object
        /*metadata.columns
            .filter(column => object.hasOwnProperty(column.propertyName))
            .forEach(column => entity[column.propertyName] = object[column.propertyName]); // todo: also need to be sure that type is correct

        // if relation is loaded then go into it recursively and transform its values too
        metadata.relations
            .filter(relation => object.hasOwnProperty(relation.propertyName))
            .forEach(relation => {
                const relationMetadata = relation.inverseEntityMetadata;
                if (!relationMetadata)
                    throw new Error("Relation metadata for the relation " + metadata.name + "#" + relation.propertyName + " is missing");

                if (relation.isManyToMany || relation.isOneToMany) {
                    if (object[relation.propertyName] instanceof Array) {
                        entity[relation.propertyName] = object[relation.propertyName].map((subObject: any) => {
                            let subEntity = relationMetadata.create();
                            // todo: support custom initial fields here
                            if (entity[relation.propertyName] instanceof Array) {
                                const existRelation = entity[relation.propertyName].find((subEntity: any) => {
                                    return subEntity[relation.propertyName] === subObject[relation.propertyName];
                                });
                                if (existRelation)
                                    this.groupAndTransform(subEntity, existRelation, relationMetadata);
                            }

                            this.groupAndTransform(subEntity, subObject, relationMetadata);
                            return subEntity;
                        });
                    } else {
                        entity[relation.propertyName] = object[relation.propertyName];
                    }
                } else {
                    if (object[relation.propertyName]) {
                        const subEntity = relationMetadata.create();
                        if (entity[relation.propertyName])
                            this.groupAndTransform(subEntity, entity[relation.propertyName], relationMetadata);

                        this.groupAndTransform(subEntity, object[relation.propertyName], relationMetadata);
                        entity[relation.propertyName] = subEntity;
                    } else {
                        entity[relation.propertyName] = object[relation.propertyName];
                    }
                }
            });*/
    }

}