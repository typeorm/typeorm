"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentToEntityTransformer = void 0;
/**
 * Transforms raw document into entity object.
 * Entity is constructed based on its entity metadata.
 */
var DocumentToEntityTransformer = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function DocumentToEntityTransformer(// private selectionMap: AliasMap,
    // private joinMappings: JoinMapping[],
    // private relationCountMetas: RelationCountAttribute[],
    enableRelationIdValues) {
        if (enableRelationIdValues === void 0) { enableRelationIdValues = false; }
        this.enableRelationIdValues = enableRelationIdValues;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    DocumentToEntityTransformer.prototype.transformAll = function (documents, metadata) {
        var _this = this;
        return documents.map(function (document) { return _this.transform(document, metadata); });
    };
    DocumentToEntityTransformer.prototype.transform = function (document, metadata) {
        var entity = metadata.create();
        var hasData = false;
        // handle _id property the special way
        if (metadata.objectIdColumn && document[metadata.objectIdColumn.databaseNameWithoutPrefixes]) {
            // todo: we can't use driver in this class
            // do we really need prepare hydrated value here? If no then no problem. If yes then think maybe prepareHydratedValue process should be extracted out of driver class?
            // entity[metadata.objectIdColumn.propertyName] = this.driver.prepareHydratedValue(document[metadata.objectIdColumn.name"], metadata.objectIdColumn);
            entity[metadata.objectIdColumn.propertyName] = document[metadata.objectIdColumn.databaseNameWithoutPrefixes];
            hasData = true;
        }
        // add special columns that contains relation ids
        if (this.enableRelationIdValues) {
            metadata.columns.filter(function (column) { return !!column.relationMetadata; }).forEach(function (column) {
                var valueInObject = document[column.databaseNameWithoutPrefixes];
                if (valueInObject !== undefined && valueInObject !== null && column.propertyName) {
                    // todo: we can't use driver in this class
                    // const value = this.driver.prepareHydratedValue(valueInObject, column);
                    entity[column.propertyName] = valueInObject;
                    hasData = true;
                }
            });
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
        metadata.ownColumns.forEach(function (column) {
            var valueInObject = document[column.databaseNameWithoutPrefixes];
            if (valueInObject !== undefined &&
                valueInObject !== null &&
                column.propertyName &&
                !column.isVirtual) {
                // const value = this.driver.prepareHydratedValue(valueInObject, column);
                entity[column.propertyName] = valueInObject;
                hasData = true;
            }
        });
        var addEmbeddedValuesRecursively = function (entity, document, embeddeds) {
            embeddeds.forEach(function (embedded) {
                if (!document[embedded.prefix])
                    return;
                if (embedded.isArray) {
                    entity[embedded.propertyName] = document[embedded.prefix].map(function (subValue, index) {
                        var newItem = embedded.create();
                        embedded.columns.forEach(function (column) {
                            newItem[column.propertyName] = subValue[column.databaseNameWithoutPrefixes];
                        });
                        addEmbeddedValuesRecursively(newItem, document[embedded.prefix][index], embedded.embeddeds);
                        return newItem;
                    });
                }
                else {
                    if (embedded.embeddeds.length && !entity[embedded.propertyName])
                        entity[embedded.propertyName] = embedded.create();
                    embedded.columns.forEach(function (column) {
                        var value = document[embedded.prefix][column.databaseNameWithoutPrefixes];
                        if (value === undefined)
                            return;
                        if (!entity[embedded.propertyName])
                            entity[embedded.propertyName] = embedded.create();
                        entity[embedded.propertyName][column.propertyName] = value;
                    });
                }
                addEmbeddedValuesRecursively(entity[embedded.propertyName], document[embedded.prefix], embedded.embeddeds);
            });
        };
        addEmbeddedValuesRecursively(entity, document, metadata.embeddeds);
        // if relation is loaded then go into it recursively and transform its values too
        /*metadata.relations.forEach(relation => {
            const relationAlias = this.selectionMap.findSelectionByParent(alias.name, relation.propertyName);
            if (relationAlias) {
                const joinMapping = this.joinMappings.find(joinMapping => joinMapping.type === "join" && joinMapping.alias === relationAlias);
                const relatedEntities = this.transformRawResultsGroup(rawSqlResults, relationAlias);
                const isResultArray = relation.isManyToMany || relation.isOneToMany;
                const result = !isResultArray ? relatedEntities[0] : relatedEntities;

                if (result) {
                    let propertyName = relation.propertyName;
                    if (joinMapping) {
                        propertyName = joinMapping.propertyName;
                    }

                    if (relation.isLazy) {
                        entity["__" + propertyName + "__"] = result;
                    } else {
                        entity[propertyName] = result;
                    }

                    if (!isResultArray || result.length > 0)
                        hasData = true;
                }
            }

            // if relation has id field then relation id/ids to that field.
            if (relation.isManyToMany) {
                if (relationAlias) {
                    const ids: any[] = [];
                    const joinMapping = this.joinMappings.find(joinMapping => joinMapping.type === "relationId" && joinMapping.alias === relationAlias);

                    if (relation.idField || joinMapping) {
                        const propertyName = joinMapping ? joinMapping.propertyName : relation.idField as string;
                        const junctionMetadata = relation.junctionEntityMetadata;
                        const columnName = relation.isOwning ? junctionMetadata.columns[1].name : junctionMetadata.columns[0].name;

                        rawSqlResults.forEach(results => {
                            if (relationAlias) {
                                const resultsKey = relationAlias.name + "_" + columnName;
                                const value = this.driver.prepareHydratedValue(results[resultsKey], relation.referencedColumn);
                                if (value !== undefined && value !== null)
                                    ids.push(value);
                            }
                        });

                        if (ids && ids.length)
                            entity[propertyName] = ids;
                    }
                }
            } else if (relation.idField) {
                const relationName = relation.name;
                entity[relation.idField] = this.driver.prepareHydratedValue(rawSqlResults[0][alias.name + "_" + relationName], relation.referencedColumn);
            }

            // if relation counter
            this.relationCountMetas.forEach(joinMeta => {
                if (joinMeta.alias === relationAlias) {
                    // console.log("relation count was found for relation: ", relation);
                    // joinMeta.entity = entity;
                    joinMeta.entities.push({ entity: entity, metadata: metadata });
                    // console.log(joinMeta);
                    // console.log("---------------------");
                }
            });
        });*/
        return hasData ? entity : null;
    };
    return DocumentToEntityTransformer;
}());
exports.DocumentToEntityTransformer = DocumentToEntityTransformer;

//# sourceMappingURL=DocumentToEntityTransformer.js.map
