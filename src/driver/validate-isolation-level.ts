import { TypeORMError } from "../error/TypeORMError"
import type { IsolationLevel } from "./types/IsolationLevel"

/**
 * Validates that the given isolation level is in the provided list of supported levels.
 * Throws a TypeORMError if not supported.
 * @param supported
 * @param isolationLevel
 */
export const validateIsolationLevel = (
    supported: readonly IsolationLevel[],
    isolationLevel?: IsolationLevel,
): void => {
    if (!isolationLevel) return

    if (!supported.includes(isolationLevel)) {
        throw new TypeORMError(
            `${isolationLevel} isolation level is not supported`,
        )
    }
}
