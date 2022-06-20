import { FindOperator } from "./FindOperator";
export class EqualOperator extends FindOperator {
    constructor(value) {
        super("equal", value);
        this["@instanceof"] = Symbol.for("EqualOperator");
    }
}

//# sourceMappingURL=EqualOperator.js.map
