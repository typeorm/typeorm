"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * This class stores up and down queries needed for migrations functionality.
 */
var SqlInMemory = /** @class */ (function () {
    function SqlInMemory() {
        this.upQueries = [];
        this.downQueries = [];
    }
    return SqlInMemory;
}());
exports.SqlInMemory = SqlInMemory;
//# sourceMappingURL=SqlInMemory.js.map