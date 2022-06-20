import { TypeORMError } from "./TypeORMError";
/**
 * Thrown if some required driver's option is not set.
 */
export class DriverOptionNotSetError extends TypeORMError {
    constructor(optionName) {
        super(`Driver option (${optionName}) is not set. ` +
            `Please set it to perform connection to the database.`);
    }
}

//# sourceMappingURL=DriverOptionNotSetError.js.map
