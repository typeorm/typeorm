"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryColumn_1 = require("../../../../../src/decorator/columns/PrimaryColumn");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../src/decorator/relations/ManyToOne");
var Post_1 = require("./Post");
var Category = /** @class */ (function () {
    function Category(id, name, post) {
        this.id = id;
        this.name = name;
        if (post)
            this.post = post;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.categories; }, {
            cascade: true,
            onDelete: "SET NULL"
        }),
        tslib_1.__metadata("design:type", Object)
    ], Category.prototype, "post", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Number, String, Post_1.Post])
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map