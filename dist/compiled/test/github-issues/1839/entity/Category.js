"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var ManyToMany_1 = require("../../../../src/decorator/relations/ManyToMany");
var Post_1 = require("./Post");
var Category = /** @class */ (function () {
    function Category() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn({ collation: "ascii_general_ci", charset: "ascii" }),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.categories; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "posts", void 0);
    Category = tslib_1.__decorate([
        src_1.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map