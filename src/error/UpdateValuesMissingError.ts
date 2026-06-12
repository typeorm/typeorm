import { TypeORMError } from "./TypeORMError"

export class UpdateValuesMissingError extends TypeORMError {
    constructor(details?: string) {
        super(
            `Cannot perform update query because update values are not defined. Call "qb.set(...)" method to specify updated values.${details ? " " + details : ""}`,
        )
    }
}
