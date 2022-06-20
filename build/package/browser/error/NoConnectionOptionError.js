import { TypeORMError } from "./TypeORMError";
/**
 * Thrown when some option is not set in the connection options.
 */
export class NoConnectionOptionError extends TypeORMError {
    constructor(optionName) {
        super(`Option "${optionName}" is not set in your connection options, please ` +
            `define "${optionName}" option in your connection options or ormconfig.json`);
    }
}

//# sourceMappingURL=NoConnectionOptionError.js.map
