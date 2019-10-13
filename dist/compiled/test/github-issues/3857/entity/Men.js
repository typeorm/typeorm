"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Person_1 = require("./Person");
var src_1 = require("../../../../src");
var Men = /** @class */ (function (_super) {
    tslib_1.__extends(Men, _super);
    function Men() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column("varchar"),
        tslib_1.__metadata("design:type", String)
    ], Men.prototype, "beardColor", void 0);
    Men = tslib_1.__decorate([
        src_1.ChildEntity()
    ], Men);
    return Men;
}(Person_1.Person));
exports.Men = Men;
//# sourceMappingURL=Men.js.map