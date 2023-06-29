"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircularRelationsError = void 0;
/**
 * Thrown when circular relations detected with nullable set to false.
 */
class CircularRelationsError extends Error {
    constructor(path) {
        super();
        this.name = "CircularRelationsError";
        Object.setPrototypeOf(this, CircularRelationsError.prototype);
        this.message = `Circular relations detected: ${path}. To resolve this issue you need to set nullable: true somewhere in this dependency structure.`;
    }
}
exports.CircularRelationsError = CircularRelationsError;

//# sourceMappingURL=CircularRelationsError.js.map
