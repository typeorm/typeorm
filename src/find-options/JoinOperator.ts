import { JoinOperatorType } from "./JoinOperatorType"

export class JoinOperator {
    readonly "@instanceof" = Symbol.for("JoinOperator")

    private readonly _type: JoinOperatorType

    constructor(type: JoinOperatorType) {
        this._type = type
    }

    get type(): JoinOperatorType {
        return this._type
    }
}
