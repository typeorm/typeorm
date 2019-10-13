"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../../src/index");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var BaseEntity_1 = require("../../../../../src/repository/BaseEntity");
var context_1 = require("./context");
var User = /** @class */ (function (_super) {
    tslib_1.__extends(User, _super);
    function User() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        index_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return context_1.RecordContext; }, function (context) { return context.user; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "contexts", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity({ name: "users" })
    ], User);
    return User;
}(BaseEntity_1.BaseEntity));
exports.User = User;
//# sourceMappingURL=user.js.map