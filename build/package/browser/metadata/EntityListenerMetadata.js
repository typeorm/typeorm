/**
 * This metadata contains all information about entity's listeners.
 */
var EntityListenerMetadata = /** @class */ (function () {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    function EntityListenerMetadata(options) {
        this.entityMetadata = options.entityMetadata;
        this.embeddedMetadata = options.embeddedMetadata;
        this.target = options.args.target;
        this.propertyName = options.args.propertyName;
        this.type = options.args.type;
    }
    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------
    /**
     * Checks if entity listener is allowed to be executed on the given entity.
     */
    EntityListenerMetadata.prototype.isAllowed = function (entity) {
        return this.entityMetadata.target === entity.constructor || // todo: .constructor won't work for entity schemas, but there are no entity listeners in schemas since there are no objects, right?
            (this.entityMetadata.target instanceof Function && entity.constructor.prototype instanceof this.entityMetadata.target); // todo: also need to implement entity schema inheritance
    };
    /**
     * Executes listener method of the given entity.
     */
    EntityListenerMetadata.prototype.execute = function (entity) {
        if (!this.embeddedMetadata)
            return entity[this.propertyName]();
        this.callEntityEmbeddedMethod(entity, this.embeddedMetadata.propertyPath.split("."));
    };
    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------
    /**
     * Calls embedded entity listener method no matter how nested it is.
     */
    EntityListenerMetadata.prototype.callEntityEmbeddedMethod = function (entity, propertyPaths) {
        var propertyPath = propertyPaths.shift();
        if (!propertyPath || !entity[propertyPath])
            return;
        if (propertyPaths.length === 0) {
            entity[propertyPath][this.propertyName]();
        }
        else {
            if (entity[propertyPath])
                this.callEntityEmbeddedMethod(entity[propertyPath], propertyPaths);
        }
    };
    return EntityListenerMetadata;
}());
export { EntityListenerMetadata };

//# sourceMappingURL=EntityListenerMetadata.js.map
