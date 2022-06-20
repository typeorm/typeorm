/**
 * Syntax sugar.
 * Allows to use brackets in WHERE expressions for better syntax.
 */
export class Brackets {
    /**
     * Given WHERE query builder that will build a WHERE expression that will be taken into brackets.
     */
    constructor(whereFactory) {
        this["@instanceof"] = Symbol.for("Brackets");
        this.whereFactory = whereFactory;
    }
}

//# sourceMappingURL=Brackets.js.map
