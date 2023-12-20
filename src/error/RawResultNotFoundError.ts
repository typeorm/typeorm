import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
export class RawResultNotFoundError extends TypeORMError {
    constructor(criteria: any) {
        super()

        this.message = `Could not find any raw result matching: ${this.stringifyCriteria(
            criteria,
        )}`
    }

    private stringifyCriteria(criteria: any): string {
        try {
            return JSON.stringify(criteria, null, 4)
        } catch (e) {}
        return "" + criteria
    }
}
