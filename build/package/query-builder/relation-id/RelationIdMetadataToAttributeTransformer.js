"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelationIdMetadataToAttributeTransformer = void 0;
var RelationIdAttribute_1 = require("./RelationIdAttribute");
var RelationIdMetadataToAttributeTransformer = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationIdMetadataToAttributeTransformer(expressionMap) {
        this.expressionMap = expressionMap;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    RelationIdMetadataToAttributeTransformer.prototype.transform = function () {
        // by example:
        // post has relation id:
        // @RelationId(post => post.categories) categoryIds
        // category has relation id
        // @RelationId(category => category.images) imageIds
        // we load post and join category
        // we expect post.categoryIds and post.category.imageIds to have relation ids
        var _this = this;
        // first create relation id attributes for all relation id metadatas of the main selected object (post from example)
        if (this.expressionMap.mainAlias) {
            this.expressionMap.mainAlias.metadata.relationIds.forEach(function (relationId) {
                var attribute = _this.metadataToAttribute(_this.expressionMap.mainAlias.name, relationId);
                _this.expressionMap.relationIdAttributes.push(attribute);
            });
        }
        // second create relation id attributes for all relation id metadatas of all joined objects (category from example)
        this.expressionMap.joinAttributes.forEach(function (join) {
            // ensure this join has a metadata, because relation id can only work for real orm entities
            if (!join.metadata || join.metadata.isJunction)
                return;
            join.metadata.relationIds.forEach(function (relationId) {
                var attribute = _this.metadataToAttribute(join.alias.name, relationId);
                _this.expressionMap.relationIdAttributes.push(attribute);
            });
        });
    };
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    RelationIdMetadataToAttributeTransformer.prototype.metadataToAttribute = function (parentAliasName, relationId) {
        return new RelationIdAttribute_1.RelationIdAttribute(this.expressionMap, {
            relationName: parentAliasName + "." + relationId.relation.propertyName,
            mapToProperty: parentAliasName + "." + relationId.propertyName,
            alias: relationId.alias,
            queryBuilderFactory: relationId.queryBuilderFactory
        });
    };
    return RelationIdMetadataToAttributeTransformer;
}());
exports.RelationIdMetadataToAttributeTransformer = RelationIdMetadataToAttributeTransformer;

//# sourceMappingURL=RelationIdMetadataToAttributeTransformer.js.map
