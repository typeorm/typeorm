import { TypeORMError } from "./TypeORMError";
export class MissingDeleteDateColumnError extends TypeORMError {
    constructor(entityMetadata) {
        super(`Entity "${entityMetadata.name}" does not have delete date columns.`);
    }
}

//# sourceMappingURL=MissingDeleteDateColumnError.js.map
