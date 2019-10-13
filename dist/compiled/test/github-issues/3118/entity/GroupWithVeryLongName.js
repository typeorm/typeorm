"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var src_1 = require("../../../../src");
var AuthorWithVeryLongName_1 = require("./AuthorWithVeryLongName");
var GroupWithVeryLongName = /** @class */ (function () {
    function GroupWithVeryLongName() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], GroupWithVeryLongName.prototype, "groupId", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], GroupWithVeryLongName.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function () { return AuthorWithVeryLongName_1.AuthorWithVeryLongName; }, function (author) { return author.groupWithVeryLongName; }),
        tslib_1.__metadata("design:type", Array)
    ], GroupWithVeryLongName.prototype, "authorsWithVeryLongName", void 0);
    GroupWithVeryLongName = tslib_1.__decorate([
        src_1.Entity()
    ], GroupWithVeryLongName);
    return GroupWithVeryLongName;
}());
exports.GroupWithVeryLongName = GroupWithVeryLongName;
//# sourceMappingURL=GroupWithVeryLongName.js.map