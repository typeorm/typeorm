import { RelationCountAttribute } from "./RelationCountAttribute";
var RelationCountMetadataToAttributeTransformer = /** @class */ (function () {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    function RelationCountMetadataToAttributeTransformer(expressionMap) {
        this.expressionMap = expressionMap;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    RelationCountMetadataToAttributeTransformer.prototype.transform = function () {
        // by example:
        // post has relation count:
        // @RelationCount(post => post.categories) categoryCount
        // category has relation count
        // @RelationCount(category => category.images) imageCount
        // we load post and join category
        // we expect post.categoryCount and post.category.imageCount to have relation counts
        var _this = this;
        // first create relation count attributes for all relation count metadatas of the main selected object (post from example)
        if (this.expressionMap.mainAlias) {
            this.expressionMap.mainAlias.metadata.relationCounts.forEach(function (relationCount) {
                var attribute = _this.metadataToAttribute(_this.expressionMap.mainAlias.name, relationCount);
                _this.expressionMap.relationCountAttributes.push(attribute);
            });
        }
        // second create relation count attributes for all relation count metadatas of all joined objects (category from example)
        this.expressionMap.joinAttributes.forEach(function (join) {
            // ensure this join has a metadata, because relation count can only work for real orm entities
            if (!join.metadata || join.metadata.isJunction)
                return;
            join.metadata.relationCounts.forEach(function (relationCount) {
                var attribute = _this.metadataToAttribute(join.alias.name, relationCount);
                _this.expressionMap.relationCountAttributes.push(attribute);
            });
        });
    };
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    RelationCountMetadataToAttributeTransformer.prototype.metadataToAttribute = function (parentAliasName, relationCount) {
        return new RelationCountAttribute(this.expressionMap, {
            relationName: parentAliasName + "." + relationCount.relation.propertyName,
            mapToProperty: parentAliasName + "." + relationCount.propertyName,
            alias: relationCount.alias,
            queryBuilderFactory: relationCount.queryBuilderFactory
        });
    };
    return RelationCountMetadataToAttributeTransformer;
}());
export { RelationCountMetadataToAttributeTransformer };

//# sourceMappingURL=RelationCountMetadataToAttributeTransformer.js.map
