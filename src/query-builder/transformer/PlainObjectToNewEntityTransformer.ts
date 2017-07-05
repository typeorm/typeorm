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
        this.groupAndTransform(newEntity, object, metadata);
        return newEntity;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    private groupAndTransform(entity: any, object: ObjectLiteral, metadata: EntityMetadata): void {

        // copy regular column properties from the given object
        metadata.columns
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
            });
    }

}