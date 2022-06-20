/**
 * Provides utilities for manipulating tree structures.
 *
 */
export class TreeRepositoryUtils {
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    static createRelationMaps(manager, metadata, alias, rawResults) {
        return rawResults.map((rawResult) => {
            const joinColumn = metadata.treeParentRelation.joinColumns[0];
            // fixes issue #2518, default to databaseName property when givenDatabaseName is not set
            const joinColumnName = joinColumn.givenDatabaseName || joinColumn.databaseName;
            const id = rawResult[alias + "_" + metadata.primaryColumns[0].databaseName];
            const parentId = rawResult[alias + "_" + joinColumnName];
            return {
                id: manager.connection.driver.prepareHydratedValue(id, metadata.primaryColumns[0]),
                parentId: manager.connection.driver.prepareHydratedValue(parentId, joinColumn),
            };
        });
    }
    static buildChildrenEntityTree(metadata, entity, entities, relationMaps, options) {
        const childProperty = metadata.treeChildrenRelation.propertyName;
        if (options.depth === 0) {
            entity[childProperty] = [];
            return;
        }
        const parentEntityId = metadata.primaryColumns[0].getEntityValue(entity);
        const childRelationMaps = relationMaps.filter((relationMap) => relationMap.parentId === parentEntityId);
        const childIds = new Set(childRelationMaps.map((relationMap) => relationMap.id));
        entity[childProperty] = entities.filter((entity) => childIds.has(metadata.primaryColumns[0].getEntityValue(entity)));
        entity[childProperty].forEach((childEntity) => {
            TreeRepositoryUtils.buildChildrenEntityTree(metadata, childEntity, entities, relationMaps, {
                ...options,
                depth: options.depth - 1,
            });
        });
    }
    static buildParentEntityTree(metadata, entity, entities, relationMaps) {
        const parentProperty = metadata.treeParentRelation.propertyName;
        const entityId = metadata.primaryColumns[0].getEntityValue(entity);
        const parentRelationMap = relationMaps.find((relationMap) => relationMap.id === entityId);
        const parentEntity = entities.find((entity) => {
            if (!parentRelationMap)
                return false;
            return (metadata.primaryColumns[0].getEntityValue(entity) ===
                parentRelationMap.parentId);
        });
        if (parentEntity) {
            entity[parentProperty] = parentEntity;
            TreeRepositoryUtils.buildParentEntityTree(metadata, entity[parentProperty], entities, relationMaps);
        }
    }
}

//# sourceMappingURL=TreeRepositoryUtils.js.map
