"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Person_1 = require("./Person");
var src_1 = require("../../../../src");
var Women = /** @class */ (function (_super) {
    tslib_1.__extends(Women, _super);
    function Women() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], Women.prototype, "brassiereSize", void 0);
    Women = tslib_1.__decorate([
        src_1.ChildEntity()
    ], Women);
    return Women;
}(Person_1.Person));
exports.Women = Women;
//# sourceMappingURL=Women.js.map