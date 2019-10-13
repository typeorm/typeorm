"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryColumn");
var JoinTable_1 = require("../../../../../../../src/decorator/relations/JoinTable");
var OneToMany_1 = require("../../../../../../../src/decorator/relations/OneToMany");
var ManyToOne_1 = require("../../../../../../../src/decorator/relations/ManyToOne");
var Post_1 = require("./Post");
var Image_1 = require("./Image");
var Category = /** @class */ (function () {
    function Category() {
        this.isRemoved = false;
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "id", void 0);
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Category.prototype, "code", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Category.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Category.prototype, "isRemoved", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return Post_1.Post; }, function (post) { return post.category; }),
        tslib_1.__metadata("design:type", Array)
    ], Category.prototype, "posts", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Image_1.Image; }, function (image) { return image.categories; }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Image_1.Image)
    ], Category.prototype, "image", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map