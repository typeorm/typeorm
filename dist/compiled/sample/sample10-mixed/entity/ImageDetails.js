"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var Image_1 = require("./Image");
var ImageDetails = /** @class */ (function () {
    function ImageDetails() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], ImageDetails.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], ImageDetails.prototype, "meta", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], ImageDetails.prototype, "comment", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return Image_1.Image; }, function (image) { return image.details; }),
        tslib_1.__metadata("design:type", Image_1.Image)
    ], ImageDetails.prototype, "image", void 0);
    ImageDetails = tslib_1.__decorate([
        index_1.Entity("sample10_image_details")
    ], ImageDetails);
    return ImageDetails;
}());
exports.ImageDetails = ImageDetails;
//# sourceMappingURL=ImageDetails.js.map