import {Subject} from "../persistence/Subject";

/**
 * Thrown when same object is scheduled for remove and updation at the same time.
 */
export class SubjectRemovedAndUpdatedError extends Error {
    name = "SubjectRemovedAndUpdatedError";

    constructor(subject: Subject) {
        super();
        this.message = `Removed entity "${subject.metadata.name}" is also scheduled for update operation. ` +
            `Make sure you are not updating and removing same object (note that update or remove may be executed by cascade operations).`;
        this.stack = new Error().stack;
    }

}