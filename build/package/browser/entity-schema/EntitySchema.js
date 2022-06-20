/**
 * Interface for entity metadata mappings stored inside "schemas" instead of models decorated by decorators.
 */
export class EntitySchema {
    constructor(options) {
        this.options = options;
        this["@instanceof"] = Symbol.for("EntitySchema");
    }
}

//# sourceMappingURL=EntitySchema.js.map
