/**
 * Thrown when circular relations detected with nullable set to false.
 */
export class CircularRelationsError extends Error {
    constructor(path) {
        super();
        this.name = "CircularRelationsError";
        Object.setPrototypeOf(this, CircularRelationsError.prototype);
        this.message = `Circular relations detected: ${path}. To resolve this issue you need to set nullable: true somewhere in this dependency structure.`;
    }
}

//# sourceMappingURL=CircularRelationsError.js.map
