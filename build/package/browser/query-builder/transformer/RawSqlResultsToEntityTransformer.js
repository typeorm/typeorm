import { __read, __spreadArray } from "tslib";
import { OrmUtils } from "../../util/OrmUtils";
import { DriverUtils } from "../../driver/DriverUtils";
/**
 * Transforms raw sql results returned from the database into entity object.
 * Entity is constructed based on its entity metadata.
 */
var RawSqlResultsToEntityTransformer = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RawSqlResultsToEntityTransformer(expressionMap, driver, rawRelationIdResults, rawRelationCountResults, queryRunner) {
        this.expressionMap = expressionMap;
        this.driver = driver;
        this.rawRelationIdResults = rawRelationIdResults;
        this.rawRelationCountResults = rawRelationCountResults;
        this.queryRunner = queryRunner;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Since db returns a duplicated rows of the data where accuracies of the same object can be duplicated
     * we need to group our result and we must have some unique id (primary key in our case)
     */
    RawSqlResultsToEntityTransformer.prototype.transform = function (rawResults, alias) {
        var _this = this;
        var group = this.group(rawResults, alias);
        var entities = [];
        group.forEach(function (results) {
            var entity = _this.transformRawResultsGroup(results, alias);
            if (entity !== undefined && !Object.values(entity).every(function (value) { return value === null; }))
                entities.push(entity);
        });
        return entities;
    };
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Groups given raw results by ids of given alias.
     */
    RawSqlResultsToEntityTransformer.prototype.group = function (rawResults, alias) {
        var _this = this;
        var map = new Map();
        var keys = [];
        if (alias.metadata.tableType === "view") {
            keys.push.apply(keys, __spreadArray([], __read(alias.metadata.columns.map(function (column) { return DriverUtils.buildColumnAlias(_this.driver, alias.name, column.databaseName); }))));
        }
        else {
            keys.push.apply(keys, __spreadArray([], __read(alias.metadata.primaryColumns.map(function (column) { return DriverUtils.buildColumnAlias(_this.driver, alias.name, column.databaseName); }))));
        }
        rawResults.forEach(function (rawResult) {
            var id = keys.map(function (key) {
                var keyValue = rawResult[key];
                if (Buffer.isBuffer(keyValue)) {
                    return keyValue.toString("hex");
                }
                if (typeof keyValue === "object") {
                    return JSON.stringify(keyValue);
                }
                return keyValue;
            }).join("_"); // todo: check partial
            var items = map.get(id);
            if (!items) {
                map.set(id, [rawResult]);
            }
            else {
                items.push(rawResult);
            }
        });
        return map;
    };
    /**
     * Transforms set of data results into single entity.
     */
    RawSqlResultsToEntityTransformer.prototype.transformRawResultsGroup = function (rawResults, alias) {
        var _this = this;
        // let hasColumns = false; // , hasEmbeddedColumns = false, hasParentColumns = false, hasParentEmbeddedColumns = false;
        var metadata = alias.metadata;
        if (metadata.discriminatorColumn) {
            var discriminatorValues_1 = rawResults.map(function (result) { return result[DriverUtils.buildColumnAlias(_this.driver, alias.name, alias.metadata.discriminatorColumn.databaseName)]; });
            var discriminatorMetadata = metadata.childEntityMetadatas.find(function (childEntityMetadata) {
                return typeof discriminatorValues_1.find(function (value) { return value === childEntityMetadata.discriminatorValue; }) !== 'undefined';
            });
            if (discriminatorMetadata)
                metadata = discriminatorMetadata;
        }
        var entity = this.expressionMap.options.indexOf("create-pojo") !== -1 ? {} : metadata.create(this.queryRunner);
        // get value from columns selections and put them into newly created entity
        var hasColumns = this.transformColumns(rawResults, alias, entity, metadata);
        var hasRelations = this.transformJoins(rawResults, entity, alias, metadata);
        var hasRelationIds = this.transformRelationIds(rawResults, alias, entity, metadata);
        var hasRelationCounts = this.transformRelationCounts(rawResults, alias, entity);
        // if we have at least one selected column then return this entity
        // since entity must have at least primary columns to be really selected and transformed into entity
        if (hasColumns)
            return entity;
        // if we don't have any selected column we should not return entity,
        // except for the case when entity only contain a primary column as a relation to another entity
        // in this case its absolutely possible our entity to not have any columns except a single relation
        var hasOnlyVirtualPrimaryColumns = metadata.primaryColumns.filter(function (column) { return column.isVirtual === false; }).length === 0; // todo: create metadata.hasOnlyVirtualPrimaryColumns
        if (hasOnlyVirtualPrimaryColumns && (hasRelations || hasRelationIds || hasRelationCounts))
            return entity;
        return undefined;
    };
    // get value from columns selections and put them into object
    RawSqlResultsToEntityTransformer.prototype.transformColumns = function (rawResults, alias, entity, metadata) {
        var _this = this;
        var hasData = false;
        metadata.columns.forEach(function (column) {
            // if table inheritance is used make sure this column is not child's column
            if (metadata.childEntityMetadatas.length > 0 && metadata.childEntityMetadatas.map(function (metadata) { return metadata.target; }).indexOf(column.target) !== -1)
                return;
            var value = rawResults[0][DriverUtils.buildColumnAlias(_this.driver, alias.name, column.databaseName)];
            if (value === undefined || column.isVirtual)
                return;
            // if user does not selected the whole entity or he used partial selection and does not select this particular column
            // then we don't add this column and its value into the entity
            if (!_this.expressionMap.selects.find(function (select) { return select.selection === alias.name || select.selection === alias.name + "." + column.propertyPath; }))
                return;
            column.setEntityValue(entity, _this.driver.prepareHydratedValue(value, column));
            if (value !== null) // we don't mark it as has data because if we will have all nulls in our object - we don't need such object
                hasData = true;
        });
        return hasData;
    };
    /**
     * Transforms joined entities in the given raw results by a given alias and stores to the given (parent) entity
     */
    RawSqlResultsToEntityTransformer.prototype.transformJoins = function (rawResults, entity, alias, metadata) {
        var _this = this;
        var hasData = false;
        // let discriminatorValue: string = "";
        // if (metadata.discriminatorColumn)
        //     discriminatorValue = rawResults[0][DriverUtils.buildColumnAlias(this.connection.driver, alias.name, alias.metadata.discriminatorColumn!.databaseName)];
        this.expressionMap.joinAttributes.forEach(function (join) {
            // skip joins without metadata
            if (!join.metadata)
                return;
            // if simple left or inner join was performed without selection then we don't need to do anything
            if (!join.isSelected)
                return;
            // this check need to avoid setting properties than not belong to entity when single table inheritance used. (todo: check if we still need it)
            // const metadata = metadata.childEntityMetadatas.find(childEntityMetadata => discriminatorValue === childEntityMetadata.discriminatorValue);
            if (join.relation && !metadata.relations.find(function (relation) { return relation === join.relation; }))
                return;
            // some checks to make sure this join is for current alias
            if (join.mapToProperty) {
                if (join.mapToPropertyParentAlias !== alias.name)
                    return;
            }
            else {
                if (!join.relation || join.parentAlias !== alias.name || join.relationPropertyPath !== join.relation.propertyPath)
                    return;
            }
            // transform joined data into entities
            var result = _this.transform(rawResults, join.alias);
            result = !join.isMany ? result[0] : result;
            result = !join.isMany && result === undefined ? null : result; // this is needed to make relations to return null when its joined but nothing was found in the database
            if (result === undefined) // if nothing was joined then simply return
                return;
            // if join was mapped to some property then save result to that property
            if (join.mapToPropertyPropertyName) {
                entity[join.mapToPropertyPropertyName] = result; // todo: fix embeds
            }
            else { // otherwise set to relation
                join.relation.setEntityValue(entity, result);
            }
            hasData = true;
        });
        return hasData;
    };
    RawSqlResultsToEntityTransformer.prototype.transformRelationIds = function (rawSqlResults, alias, entity, metadata) {
        var _this = this;
        var hasData = false;
        this.rawRelationIdResults.forEach(function (rawRelationIdResult) {
            if (rawRelationIdResult.relationIdAttribute.parentAlias !== alias.name)
                return;
            var relation = rawRelationIdResult.relationIdAttribute.relation;
            var valueMap = _this.createValueMapFromJoinColumns(relation, rawRelationIdResult.relationIdAttribute.parentAlias, rawSqlResults);
            if (valueMap === undefined || valueMap === null)
                return;
            var idMaps = rawRelationIdResult.results.map(function (result) {
                var entityPrimaryIds = _this.extractEntityPrimaryIds(relation, result);
                if (OrmUtils.compareIds(entityPrimaryIds, valueMap) === false)
                    return;
                var columns;
                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    columns = relation.joinColumns.map(function (joinColumn) { return joinColumn; });
                }
                else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                    columns = relation.inverseEntityMetadata.primaryColumns.map(function (joinColumn) { return joinColumn; });
                    // columns = relation.inverseRelation!.joinColumns.map(joinColumn => joinColumn.referencedColumn!); //.inverseEntityMetadata.primaryColumns.map(joinColumn => joinColumn);
                }
                else { // ManyToMany
                    if (relation.isOwning) {
                        columns = relation.inverseJoinColumns.map(function (joinColumn) { return joinColumn; });
                    }
                    else {
                        columns = relation.inverseRelation.joinColumns.map(function (joinColumn) { return joinColumn; });
                    }
                }
                var idMap = columns.reduce(function (idMap, column) {
                    var value = result[column.databaseName];
                    if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                        if (column.isVirtual && column.referencedColumn && column.referencedColumn.propertyName !== column.propertyName) // if column is a relation
                            value = column.referencedColumn.createValueMap(value);
                        return OrmUtils.mergeDeep(idMap, column.createValueMap(value));
                    }
                    else {
                        if (column.referencedColumn.referencedColumn) // if column is a relation
                            value = column.referencedColumn.referencedColumn.createValueMap(value);
                        return OrmUtils.mergeDeep(idMap, column.referencedColumn.createValueMap(value));
                    }
                }, {});
                if (columns.length === 1 && rawRelationIdResult.relationIdAttribute.disableMixedMap === false) {
                    if (relation.isOneToMany || relation.isOneToOneNotOwner) {
                        return columns[0].getEntityValue(idMap);
                    }
                    else {
                        return columns[0].referencedColumn.getEntityValue(idMap);
                    }
                }
                return idMap;
            }).filter(function (result) { return result !== undefined; });
            var properties = rawRelationIdResult.relationIdAttribute.mapToPropertyPropertyPath.split(".");
            var mapToProperty = function (properties, map, value) {
                var property = properties.shift();
                if (property && properties.length === 0) {
                    map[property] = value;
                    return map;
                }
                else if (property && properties.length > 0) {
                    mapToProperty(properties, map[property], value);
                }
                else {
                    return map;
                }
            };
            if (relation.isOneToOne || relation.isManyToOne) {
                if (idMaps[0] !== undefined) {
                    mapToProperty(properties, entity, idMaps[0]);
                    hasData = true;
                }
            }
            else {
                mapToProperty(properties, entity, idMaps);
                if (idMaps.length > 0) {
                    hasData = true;
                }
            }
        });
        return hasData;
    };
    RawSqlResultsToEntityTransformer.prototype.transformRelationCounts = function (rawSqlResults, alias, entity) {
        var _this = this;
        var hasData = false;
        this.rawRelationCountResults
            .filter(function (rawRelationCountResult) { return rawRelationCountResult.relationCountAttribute.parentAlias === alias.name; })
            .forEach(function (rawRelationCountResult) {
            var relation = rawRelationCountResult.relationCountAttribute.relation;
            var referenceColumnName;
            if (relation.isOneToMany) {
                referenceColumnName = relation.inverseRelation.joinColumns[0].referencedColumn.databaseName; // todo: fix joinColumns[0]
            }
            else {
                referenceColumnName = relation.isOwning ? relation.joinColumns[0].referencedColumn.databaseName : relation.inverseRelation.joinColumns[0].referencedColumn.databaseName;
            }
            var referenceColumnValue = rawSqlResults[0][DriverUtils.buildColumnAlias(_this.driver, alias.name, referenceColumnName)]; // we use zero index since its grouped data // todo: selection with alias for entity columns wont work
            if (referenceColumnValue !== undefined && referenceColumnValue !== null) {
                entity[rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName] = 0;
                rawRelationCountResult.results
                    .filter(function (result) { return result["parentId"] === referenceColumnValue; })
                    .forEach(function (result) {
                    entity[rawRelationCountResult.relationCountAttribute.mapToPropertyPropertyName] = parseInt(result["cnt"]);
                    hasData = true;
                });
            }
        });
        return hasData;
    };
    RawSqlResultsToEntityTransformer.prototype.createValueMapFromJoinColumns = function (relation, parentAlias, rawSqlResults) {
        var _this = this;
        var columns;
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.entityMetadata.primaryColumns.map(function (joinColumn) { return joinColumn; });
        }
        else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation.joinColumns.map(function (joinColumn) { return joinColumn; });
        }
        else {
            if (relation.isOwning) {
                columns = relation.joinColumns.map(function (joinColumn) { return joinColumn; });
            }
            else {
                columns = relation.inverseRelation.inverseJoinColumns.map(function (joinColumn) { return joinColumn; });
            }
        }
        return columns.reduce(function (valueMap, column) {
            rawSqlResults.forEach(function (rawSqlResult) {
                if (relation.isManyToOne || relation.isOneToOneOwner) {
                    valueMap[column.databaseName] = _this.driver.prepareHydratedValue(rawSqlResult[DriverUtils.buildColumnAlias(_this.driver, parentAlias, column.databaseName)], column);
                }
                else {
                    valueMap[column.databaseName] = _this.driver.prepareHydratedValue(rawSqlResult[DriverUtils.buildColumnAlias(_this.driver, parentAlias, column.referencedColumn.databaseName)], column);
                }
            });
            return valueMap;
        }, {});
    };
    RawSqlResultsToEntityTransformer.prototype.extractEntityPrimaryIds = function (relation, relationIdRawResult) {
        var columns;
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            columns = relation.entityMetadata.primaryColumns.map(function (joinColumn) { return joinColumn; });
        }
        else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            columns = relation.inverseRelation.joinColumns.map(function (joinColumn) { return joinColumn; });
        }
        else {
            if (relation.isOwning) {
                columns = relation.joinColumns.map(function (joinColumn) { return joinColumn; });
            }
            else {
                columns = relation.inverseRelation.inverseJoinColumns.map(function (joinColumn) { return joinColumn; });
            }
        }
        return columns.reduce(function (data, column) {
            data[column.databaseName] = relationIdRawResult[column.databaseName];
            return data;
        }, {});
    };
    return RawSqlResultsToEntityTransformer;
}());
export { RawSqlResultsToEntityTransformer };

//# sourceMappingURL=RawSqlResultsToEntityTransformer.js.map
