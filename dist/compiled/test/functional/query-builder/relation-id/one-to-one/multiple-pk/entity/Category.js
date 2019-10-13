"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../../../../src/decorator/columns/PrimaryColumn");
var Post_1 = require("./Post");
var Image_1 = require("./Image");
var OneToOne_1 = require("../../../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../../../src/decorator/relations/JoinColumn");
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
        OneToOne_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.category; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Category.prototype, "post", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Image_1.Image; }, function (image) { return image.category; }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Image_1.Image)
    ], Category.prototype, "image", void 0);
    Category = tslib_1.__decorate([
        Entity_1.Entity()
    ], Category);
    return Category;
}());
exports.Category = Category;
//# sourceMappingURL=Category.js.map