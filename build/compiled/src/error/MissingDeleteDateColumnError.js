"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingDeleteDateColumnError = void 0;
/**
 */
class MissingDeleteDateColumnError extends Error {
    constructor(entityMetadata) {
        super();
        this.name = "MissingDeleteDateColumnError";
        Object.setPrototypeOf(this, MissingDeleteDateColumnError.prototype);
        this.message = `Entity "${entityMetadata.name}" does not have delete date columns.`;
    }
}
exports.MissingDeleteDateColumnError = MissingDeleteDateColumnError;
//# sourceMappingURL=MissingDeleteDateColumnError.js.map