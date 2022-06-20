import { Brackets } from "./Brackets";
/**
 * Syntax sugar.
 * Allows to use negate brackets in WHERE expressions for better syntax.
 */
export class NotBrackets extends Brackets {
    constructor() {
        super(...arguments);
        this["@instanceof"] = Symbol.for("NotBrackets");
    }
}

//# sourceMappingURL=NotBrackets.js.map
