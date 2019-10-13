"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Group = /** @class */ (function (_super) {
    tslib_1.__extends(Group, _super);
    function Group() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Group.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ nullable: false }),
        tslib_1.__metadata("design:type", String)
    ], Group.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.TreeChildren(),
        tslib_1.__metadata("design:type", Group)
    ], Group.prototype, "children", void 0);
    tslib_1.__decorate([
        src_1.TreeParent(),
        tslib_1.__metadata("design:type", Group)
    ], Group.prototype, "parent", void 0);
    Group = tslib_1.__decorate([
        src_1.Entity(),
        src_1.Tree("closure-table")
    ], Group);
    return Group;
}(src_1.BaseEntity));
exports.Group = Group;
//# sourceMappingURL=Group.js.map