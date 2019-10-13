"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var OneToMany_1 = require("../../../../../src/decorator/relations/OneToMany");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Post_1 = require("./Post");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "personId", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Post_1.Post; }, function (post) { return post.counters.likedUser; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "likedPosts", void 0);
    User = tslib_1.__decorate([
        Entity_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map