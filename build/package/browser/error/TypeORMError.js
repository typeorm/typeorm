export class TypeORMError extends Error {
    get name() {
        return this.constructor.name;
    }
    constructor(message) {
        super(message);
        // restore prototype chain because the base `Error` type
        // will break the prototype chain a little
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, new.target.prototype);
        }
        else {
            ;
            this.__proto__ = new.target.prototype;
        }
    }
}

//# sourceMappingURL=TypeORMError.js.map
