"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var src_1 = require("../../../../src");
var GroupWithVeryLongName_1 = require("./GroupWithVeryLongName");
var PostWithVeryLongName_1 = require("./PostWithVeryLongName");
var AuthorWithVeryLongName = /** @class */ (function () {
    function AuthorWithVeryLongName() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], AuthorWithVeryLongName.prototype, "authorId", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], AuthorWithVeryLongName.prototype, "firstName", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function () { return GroupWithVeryLongName_1.GroupWithVeryLongName; }, function (group) { return group.authorsWithVeryLongName; }),
        tslib_1.__metadata("design:type", GroupWithVeryLongName_1.GroupWithVeryLongName)
    ], AuthorWithVeryLongName.prototype, "groupWithVeryLongName", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function () { return PostWithVeryLongName_1.PostWithVeryLongName; }, function (post) { return post.authorWithVeryLongName; }),
        tslib_1.__metadata("design:type", Array)
    ], AuthorWithVeryLongName.prototype, "postsWithVeryLongName", void 0);
    AuthorWithVeryLongName = tslib_1.__decorate([
        src_1.Entity()
    ], AuthorWithVeryLongName);
    return AuthorWithVeryLongName;
}());
exports.AuthorWithVeryLongName = AuthorWithVeryLongName;
//# sourceMappingURL=AuthorWithVeryLongName.js.map