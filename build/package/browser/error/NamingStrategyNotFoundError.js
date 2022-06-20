import { TypeORMError } from "./TypeORMError";
/**
 * Thrown when consumer tries to use naming strategy that does not exist.
 */
export class NamingStrategyNotFoundError extends TypeORMError {
    constructor(strategyName, connectionName) {
        super();
        const name = typeof strategyName === "function"
            ? strategyName.name
            : strategyName;
        this.message =
            `Naming strategy "${name}" was not found. Looks like this naming strategy does not ` +
                `exist or it was not registered in current "${connectionName}" connection?`;
    }
}

//# sourceMappingURL=NamingStrategyNotFoundError.js.map
