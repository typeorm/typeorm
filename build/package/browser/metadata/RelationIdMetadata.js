/**
 * Contains all information about entity's relation count.
 */
var RelationIdMetadata = /** @class */ (function () {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    function RelationIdMetadata(options) {
        this.entityMetadata = options.entityMetadata;
        this.target = options.args.target;
        this.propertyName = options.args.propertyName;
        this.relationNameOrFactory = options.args.relation;
        this.alias = options.args.alias;
        this.queryBuilderFactory = options.args.queryBuilderFactory;
    }
    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------
    /**
     * Sets relation id value from the given entity.
     *
     * todo: make it to work in embeds as well.
     */
    RelationIdMetadata.prototype.setValue = function (entity) {
        var _this = this;
        var inverseEntity = this.relation.getEntityValue(entity);
        if (Array.isArray(inverseEntity)) {
            entity[this.propertyName] = inverseEntity.map(function (item) {
                return _this.relation.inverseEntityMetadata.getEntityIdMixedMap(item);
            }).filter(function (item) { return item !== null && item !== undefined; });
        }
        else {
            var value = this.relation.inverseEntityMetadata.getEntityIdMixedMap(inverseEntity);
            if (value !== undefined)
                entity[this.propertyName] = value;
        }
    };
    // ---------------------------------------------------------------------
    // Public Builder Methods
    // ---------------------------------------------------------------------
    /**
     * Builds some depend relation id properties.
     * This builder method should be used only after entity metadata, its properties map and all relations are build.
     */
    RelationIdMetadata.prototype.build = function () {
        var propertyPath = this.relationNameOrFactory instanceof Function ? this.relationNameOrFactory(this.entityMetadata.propertiesMap) : this.relationNameOrFactory;
        var relation = this.entityMetadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error("Cannot find relation " + propertyPath + ". Wrong relation specified for @RelationId decorator.");
        this.relation = relation;
    };
    return RelationIdMetadata;
}());
export { RelationIdMetadata };

//# sourceMappingURL=RelationIdMetadata.js.map
