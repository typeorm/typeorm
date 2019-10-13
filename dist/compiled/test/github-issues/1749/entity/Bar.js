"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var src_1 = require("../../../../src");
var Bar = /** @class */ (function () {
    function Bar() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", String)
    ], Bar.prototype, "id", void 0);
    Bar = tslib_1.__decorate([
        Entity_1.Entity("bar", { schema: "foo" })
    ], Bar);
    return Bar;
}());
exports.Bar = Bar;
//# sourceMappingURL=Bar.js.map