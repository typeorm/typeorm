"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeRepositoryNotSupportedError = void 0;
class TreeRepositoryNotSupportedError extends Error {
    constructor(driver) {
        super();
        this.name = "TreeRepositoryNotSupportedError";
        Object.setPrototypeOf(this, TreeRepositoryNotSupportedError.prototype);
        this.message = `Tree repositories are not supported in ${driver.options.type} driver.`;
    }
}
exports.TreeRepositoryNotSupportedError = TreeRepositoryNotSupportedError;

//# sourceMappingURL=TreeRepositoryNotSupportedError.js.map
