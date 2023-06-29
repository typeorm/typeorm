"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoConnectionOptionError = void 0;
/**
 * Thrown when some option is not set in the connection options.
 */
class NoConnectionOptionError extends Error {
    constructor(optionName) {
        super();
        Object.setPrototypeOf(this, NoConnectionOptionError.prototype);
        this.message = `Option "${optionName}" is not set in your connection options, please define "${optionName}" option in your connection options or ormconfig.json`;
    }
}
exports.NoConnectionOptionError = NoConnectionOptionError;

//# sourceMappingURL=NoConnectionOptionError.js.map
