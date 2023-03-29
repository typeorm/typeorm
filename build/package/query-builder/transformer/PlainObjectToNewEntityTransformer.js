"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlainObjectToNewEntityTransformer = void 0;
/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 */
var PlainObjectToNewEntityTransformer = /** @class */ (function () {
    function PlainObjectToNewEntityTransformer() {
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    PlainObjectToNewEntityTransformer.prototype.transform = function (newEntity, object, metadata, getLazyRelationsPromiseValue) {
        if (getLazyRelationsPromiseValue === void 0) { getLazyRelationsPromiseValue = false; }
        // console.log("groupAndTransform entity:", newEntity);
        // console.log("groupAndTransform object:", object);
        this.groupAndTransform(newEntity, object, metadata, getLazyRelationsPromiseValue);
        // console.log("result:", newEntity);
        return newEntity;
    };
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    PlainObjectToNewEntityTransformer.prototype.groupAndTransform = function (entity, object, metadata, getLazyRelationsPromiseValue) {
        // console.log("groupAndTransform entity:", entity);
        // console.log("groupAndTransform object:", object);
        var _this = this;
        if (getLazyRelationsPromiseValue === void 0) { getLazyRelationsPromiseValue = false; }
        // copy regular column properties from the given object
        metadata.nonVirtualColumns.forEach(function (column) {
            var objectColumnValue = column.getEntityValue(object);
            if (objectColumnValue !== undefined)
                column.setEntityValue(entity, objectColumnValue);
        });
        // // copy relation properties from the given object
        if (metadata.relations.length) {
            metadata.relations.forEach(function (relation) {
                var entityRelatedValue = relation.getEntityValue(entity);
                var objectRelatedValue = relation.getEntityValue(object, getLazyRelationsPromiseValue);
                if (objectRelatedValue === undefined)
                    return;
                if (relation.isOneToMany || relation.isManyToMany) {
                    if (!Array.isArray(objectRelatedValue))
                        return;
                    if (!entityRelatedValue) {
                        entityRelatedValue = [];
                        relation.setEntityValue(entity, entityRelatedValue);
                    }
                    objectRelatedValue.forEach(function (objectRelatedValueItem) {
                        // check if we have this item from the merging object in the original entity we merge into
                        var objectRelatedValueEntity = entityRelatedValue.find(function (entityRelatedValueItem) {
                            return relation.inverseEntityMetadata.compareEntities(objectRelatedValueItem, entityRelatedValueItem);
                        });
                        // if such item already exist then merge new data into it, if its not we create a new entity and merge it into the array
                        if (!objectRelatedValueEntity) {
                            objectRelatedValueEntity = relation.inverseEntityMetadata.create();
                            entityRelatedValue.push(objectRelatedValueEntity);
                        }
                        _this.groupAndTransform(objectRelatedValueEntity, objectRelatedValueItem, relation.inverseEntityMetadata, getLazyRelationsPromiseValue);
                    });
                }
                else {
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
                    _this.groupAndTransform(entityRelatedValue, objectRelatedValue, relation.inverseEntityMetadata, getLazyRelationsPromiseValue);
                }
            });
        }
    };
    return PlainObjectToNewEntityTransformer;
}());
exports.PlainObjectToNewEntityTransformer = PlainObjectToNewEntityTransformer;

//# sourceMappingURL=PlainObjectToNewEntityTransformer.js.map
