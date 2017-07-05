/**
 * Thrown if some required driver's option is not set.
 */
export class DriverOptionNotSetError extends Error {
    name = "DriverOptionNotSetError";

    constructor(optionName: string) {
        super();
        this.message = `Driver option (${optionName}) is not set. Please set it to perform connection to the database.`;
    }

}