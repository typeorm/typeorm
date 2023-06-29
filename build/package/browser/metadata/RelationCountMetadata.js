/**
 * Contains all information about entity's relation count.
 */
export class RelationCountMetadata {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(options) {
        this.entityMetadata = options.entityMetadata;
        this.target = options.args.target;
        this.propertyName = options.args.propertyName;
        this.relationNameOrFactory = options.args.relation;
        this.alias = options.args.alias;
        this.queryBuilderFactory = options.args.queryBuilderFactory;
    }
    // ---------------------------------------------------------------------
    // Public Builder Methods
    // ---------------------------------------------------------------------
    /**
     * Builds some depend relation count metadata properties.
     * This builder method should be used only after entity metadata, its properties map and all relations are build.
     */
    build() {
        const propertyPath = this.relationNameOrFactory instanceof Function ? this.relationNameOrFactory(this.entityMetadata.propertiesMap) : this.relationNameOrFactory;
        const relation = this.entityMetadata.findRelationWithPropertyPath(propertyPath);
        if (!relation)
            throw new Error(`Cannot find relation ${propertyPath}. Wrong relation specified for @RelationCount decorator.`);
        this.relation = relation;
    }
}

//# sourceMappingURL=RelationCountMetadata.js.map
