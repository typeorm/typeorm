"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var Post_1 = require("./Post");
var ManyToMany_1 = require("../../../../../../src/decorator/relations/ManyToMany");
var Image = /** @class */ (function () {
    function Image() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Image.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Image.prototype, "url", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return Post_1.Post; }, function (post) { return post.images; }),
        tslib_1.__metadata("design:type", Array)
    ], Image.prototype, "posts", void 0);
    Image = tslib_1.__decorate([
        Entity_1.Entity()
    ], Image);
    return Image;
}());
exports.Image = Image;
//# sourceMappingURL=Image.js.map