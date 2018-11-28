import {ConjunctiveOperatorType} from "./ConjunctiveOperatorType";

export class ConjunctiveOperator<T> {

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Operator type.
     */
    private _type: ConjunctiveOperatorType;

    /**
     * Parameter value.
     */
    private _value: any;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(type: ConjunctiveOperatorType, value: T) {
        this._type = type;
        this._value = value;
    }

    /**
     * Gets the final value needs to be used as parameter value.
     */
    get value(): T {
        return this._value;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Gets SQL that needs to be inserted into final query.
     */
    toSql(): string {
        switch (this._type) {
            case "and":
                return " AND ";
            case "or":
                return " OR ";
            default:
                return assertNever(this._type);
        }
    }


}

function assertNever(x: never): never {
    throw new Error("Unexpected object: " + x);
}