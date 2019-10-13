"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Dummy = /** @class */ (function () {
    function Dummy() {
    }
    tslib_1.__decorate([
        Column_1.Column("integer", {
            generated: true,
            nullable: false,
            primary: true,
        }),
        tslib_1.__metadata("design:type", Number)
    ], Dummy.prototype, "id", void 0);
    Dummy = tslib_1.__decorate([
        Entity_1.Entity()
    ], Dummy);
    return Dummy;
}());
exports.Dummy = Dummy;
//# sourceMappingURL=dummy.js.map