/**
 * Thrown when user tries to save/remove/etc. constructor-less object (object literal) instead of entity.
 */
export class RestoreOnNonSoftDeleteEntity extends Error {
    name = "RestoreOnNonSoftDeleteEntity";

    constructor() {
        super();
        this.message = `Cannot restore an entity which does not have a SoftDeleteDateColumn`;
        this.stack = new Error().stack;
    }

}
