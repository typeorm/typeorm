/**
 * Thrown when circular relations detected with nullable set to false.
 */
export class CircularRelationsError extends Error {
    name = "CircularRelationsError";

    constructor(path: string) {
        super(`Circular relations detected: ${path}. To resolve this issue you need to set nullable: false somewhere in this dependency structure.`);
    }

}