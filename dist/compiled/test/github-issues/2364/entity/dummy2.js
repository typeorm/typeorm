"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var src_1 = require("../../../../src");
var Dummy2 = /** @class */ (function () {
    function Dummy2() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn("integer", {
            generated: true,
            nullable: false,
            primary: true,
        }),
        tslib_1.__metadata("design:type", Number)
    ], Dummy2.prototype, "id", void 0);
    Dummy2 = tslib_1.__decorate([
        Entity_1.Entity()
    ], Dummy2);
    return Dummy2;
}());
exports.Dummy2 = Dummy2;
//# sourceMappingURL=dummy2.js.map