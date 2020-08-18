/**
 */
export class SimpleJsonIsNotAStringError extends Error {
    name = "SimpleJsonIsNotAStringError";

    constructor(value: any) {
        super();
        Object.setPrototypeOf(this, SimpleJsonIsNotAStringError.prototype);
        this.message = `simple-json value is type ${typeof value} and not a string. Check the db column to verify it is a string/text/varchar type.`;
    }

}
