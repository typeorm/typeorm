"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Post_1 = require("./Post");
var ImageDetails_1 = require("./ImageDetails");
var JoinColumn_1 = require("../../../src/decorator/relations/JoinColumn");
var Image = /** @class */ (function () {
    function Image() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Image.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Image.prototype, "name", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.images; }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Image.prototype, "post", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Post_1.Post; }, function (post) { return post.secondaryImages; }, {
            cascade: ["insert"]
        }),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Image.prototype, "secondaryPost", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return ImageDetails_1.ImageDetails; }, function (details) { return details.image; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", ImageDetails_1.ImageDetails)
    ], Image.prototype, "details", void 0);
    Image = tslib_1.__decorate([
        index_1.Entity("sample10_image")
    ], Image);
    return Image;
}());
exports.Image = Image;
//# sourceMappingURL=Image.js.map