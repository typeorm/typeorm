import {TypeORMError} from "./TypeORMError";

/**
 * Thrown when a table is attempting to be created using a reserved keyword for it's name.
 *
 * @https://docs.oracle.com/cd/B10501_01/appdev.920/a42525/apb.htm
 */
export class ReservedKeywordError extends TypeORMError {
    constructor(tableName: string) {
        super(
            `${tableName.toUpperCase()} is a reserved keyword. Use here is not allowed`
        );
    }
}
