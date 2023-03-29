"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brackets = void 0;
/**
 * Syntax sugar.
 * Allows to use brackets in WHERE expressions for better syntax.
 */
var Brackets = /** @class */ (function () {
    /**
     * Given WHERE query builder that will build a WHERE expression that will be taken into brackets.
     */
    function Brackets(whereFactory) {
        this.whereFactory = whereFactory;
    }
    return Brackets;
}());
exports.Brackets = Brackets;

//# sourceMappingURL=Brackets.js.map
