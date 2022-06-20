import { TypeORMError } from "./TypeORMError";
export class TreeRepositoryNotSupportedError extends TypeORMError {
    constructor(driver) {
        super(`Tree repositories are not supported in ${driver.options.type} driver.`);
    }
}

//# sourceMappingURL=TreeRepositoryNotSupportedError.js.map
