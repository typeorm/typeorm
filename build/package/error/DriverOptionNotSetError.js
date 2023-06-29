"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverOptionNotSetError = void 0;
/**
 * Thrown if some required driver's option is not set.
 */
class DriverOptionNotSetError extends Error {
    constructor(optionName) {
        super();
        this.name = "DriverOptionNotSetError";
        Object.setPrototypeOf(this, DriverOptionNotSetError.prototype);
        this.message = `Driver option (${optionName}) is not set. Please set it to perform connection to the database.`;
    }
}
exports.DriverOptionNotSetError = DriverOptionNotSetError;

//# sourceMappingURL=DriverOptionNotSetError.js.map
