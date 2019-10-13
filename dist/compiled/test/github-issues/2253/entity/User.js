"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "type", void 0);
    User = tslib_1.__decorate([
        src_1.TableInheritance({ column: "type" }),
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
var SubUser = /** @class */ (function (_super) {
    tslib_1.__extends(SubUser, _super);
    function SubUser() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], SubUser.prototype, "anotherColumn", void 0);
    SubUser = tslib_1.__decorate([
        src_1.ChildEntity("sub")
    ], SubUser);
    return SubUser;
}(User));
exports.SubUser = SubUser;
//# sourceMappingURL=User.js.map