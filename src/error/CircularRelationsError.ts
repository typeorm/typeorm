/**
 * Thrown when circular relations detected with nullable set to false.
 */
export class CircularRelationsError extends Error {
    name = "CircularRelationsError";

    constructor(path: string) {
        super();
        Object.setPrototypeOf(this, CircularRelationsError.prototype);
        this.message = `Circular relations detected: ${path}. To resolve this issue you need to set nullable: true somewhere in this dependency structure.`;
    }

}
