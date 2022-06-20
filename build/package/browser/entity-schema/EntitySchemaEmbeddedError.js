import { TypeORMError } from "../error";
export class EntitySchemaEmbeddedError extends TypeORMError {
    static createEntitySchemaIsRequiredException(field) {
        return new EntitySchemaEmbeddedError(`EntitySchema is required for ${field} embedded field`);
    }
    static createTargetIsRequired(field) {
        return new EntitySchemaEmbeddedError(`Target field is required for ${field} embedded EntitySchema`);
    }
    constructor(message) {
        super(message);
    }
}

//# sourceMappingURL=EntitySchemaEmbeddedError.js.map
