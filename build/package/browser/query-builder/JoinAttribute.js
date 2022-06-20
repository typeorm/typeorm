import { QueryBuilderUtils } from "./QueryBuilderUtils";
import { ObjectUtils } from "../util/ObjectUtils";
import { TypeORMError } from "../error";
import { DriverUtils } from "../driver/DriverUtils";
/**
 * Stores all join attributes which will be used to build a JOIN query.
 */
export class JoinAttribute {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(connection, queryExpressionMap, joinAttribute) {
        this.connection = connection;
        this.queryExpressionMap = queryExpressionMap;
        this.isSelectedEvaluated = false;
        this.relationEvaluated = false;
        ObjectUtils.assign(this, joinAttribute || {});
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    get isMany() {
        if (this.isMappingMany !== undefined)
            return this.isMappingMany;
        if (this.relation)
            return this.relation.isManyToMany || this.relation.isOneToMany;
        return false;
    }
    /**
     * Indicates if this join is selected.
     */
    get isSelected() {
        if (!this.isSelectedEvaluated) {
            let getValue = () => {
                for (const select of this.queryExpressionMap.selects) {
                    if (select.selection === this.alias.name)
                        return true;
                    if (this.metadata &&
                        !!this.metadata.columns.find((column) => select.selection ===
                            this.alias.name + "." + column.propertyPath))
                        return true;
                }
                return false;
            };
            this.isSelectedCache = getValue();
            this.isSelectedEvaluated = true;
        }
        return this.isSelectedCache;
    }
    /**
     * Name of the table which we should join.
     */
    get tablePath() {
        return this.metadata
            ? this.metadata.tablePath
            : this.entityOrProperty;
    }
    /**
     * Alias of the parent of this join.
     * For example, if we join ("post.category", "categoryAlias") then "post" is a parent alias.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get parentAlias() {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;
        return this.entityOrProperty.substr(0, this.entityOrProperty.indexOf("."));
    }
    /**
     * Relation property name of the parent.
     * This is used to understand what is joined.
     * For example, if we join ("post.category", "categoryAlias") then "category" is a relation property.
     * This value is extracted from entityOrProperty value.
     * This is available when join was made using "post.category" syntax.
     */
    get relationPropertyPath() {
        if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
            return undefined;
        return this.entityOrProperty.substr(this.entityOrProperty.indexOf(".") + 1);
    }
    /**
     * Relation of the parent.
     * This is used to understand what is joined.
     * This is available when join was made using "post.category" syntax.
     * Relation can be undefined if entityOrProperty is regular entity or custom table.
     */
    get relation() {
        if (!this.relationEvaluated) {
            let getValue = () => {
                if (!QueryBuilderUtils.isAliasProperty(this.entityOrProperty))
                    return undefined;
                const relationOwnerSelection = this.queryExpressionMap.findAliasByName(this.parentAlias);
                let relation = relationOwnerSelection.metadata.findRelationWithPropertyPath(this.relationPropertyPath);
                if (relation) {
                    return relation;
                }
                if (relationOwnerSelection.metadata.parentEntityMetadata) {
                    relation =
                        relationOwnerSelection.metadata.parentEntityMetadata.findRelationWithPropertyPath(this.relationPropertyPath);
                    if (relation) {
                        return relation;
                    }
                }
                throw new TypeORMError(`Relation with property path ${this.relationPropertyPath} in entity was not found.`);
            };
            this.relationCache = getValue.bind(this)();
            this.relationEvaluated = true;
        }
        return this.relationCache;
    }
    /**
     * Metadata of the joined entity.
     * If table without entity was joined, then it will return undefined.
     */
    get metadata() {
        // entityOrProperty is relation, e.g. "post.category"
        if (this.relation)
            return this.relation.inverseEntityMetadata;
        // entityOrProperty is Entity class
        if (this.connection.hasMetadata(this.entityOrProperty))
            return this.connection.getMetadata(this.entityOrProperty);
        return undefined;
        /*if (typeof this.entityOrProperty === "string") { // entityOrProperty is a custom table

            // first try to find entity with such name, this is needed when entity does not have a target class,
            // and its target is a string name (scenario when plain old javascript is used or entity schema is loaded from files)
            const metadata = this.connection.entityMetadatas.find(metadata => metadata.name === this.entityOrProperty);
            if (metadata)
                return metadata;

            // check if we have entity with such table name, and use its metadata if found
            return this.connection.entityMetadatas.find(metadata => metadata.tableName === this.entityOrProperty);
        }*/
    }
    /**
     * Generates alias of junction table, whose ids we get.
     */
    get junctionAlias() {
        if (!this.relation)
            throw new TypeORMError(`Cannot get junction table for join without relation.`);
        if (this.relation.isOwning) {
            return DriverUtils.buildAlias(this.connection.driver, this.parentAlias, this.alias.name);
        }
        else {
            return DriverUtils.buildAlias(this.connection.driver, this.alias.name, this.parentAlias);
        }
    }
    get mapToPropertyParentAlias() {
        if (!this.mapToProperty)
            return undefined;
        return this.mapToProperty.split(".")[0];
    }
    get mapToPropertyPropertyName() {
        if (!this.mapToProperty)
            return undefined;
        return this.mapToProperty.split(".")[1];
    }
}

//# sourceMappingURL=JoinAttribute.js.map
