"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var ImageInfo_1 = require("./ImageInfo");
var OneToMany_1 = require("../../../../../src/decorator/relations/OneToMany");
var Image = /** @class */ (function () {
    function Image() {
        this.informations = [];
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Image.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Image.prototype, "title", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return ImageInfo_1.ImageInfo; }, function (imageInfo) { return imageInfo.image; }),
        tslib_1.__metadata("design:type", Array)
    ], Image.prototype, "informations", void 0);
    Image = tslib_1.__decorate([
        Entity_1.Entity()
    ], Image);
    return Image;
}());
exports.Image = Image;
//# sourceMappingURL=Image.js.map