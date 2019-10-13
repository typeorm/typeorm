"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../src/decorator/relations/ManyToOne");
var Image_1 = require("./Image");
var ImageInfo = /** @class */ (function () {
    function ImageInfo() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], ImageInfo.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], ImageInfo.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Image_1.Image; }, function (image) { return image.informations; }),
        tslib_1.__metadata("design:type", Image_1.Image)
    ], ImageInfo.prototype, "image", void 0);
    ImageInfo = tslib_1.__decorate([
        Entity_1.Entity()
    ], ImageInfo);
    return ImageInfo;
}());
exports.ImageInfo = ImageInfo;
//# sourceMappingURL=ImageInfo.js.map