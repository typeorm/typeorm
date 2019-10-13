"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Photo_1 = require("./Photo");
var PhotoMetadata = /** @class */ (function () {
    function PhotoMetadata() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PhotoMetadata.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], PhotoMetadata.prototype, "height", void 0);
    tslib_1.__decorate([
        index_1.Column("int"),
        tslib_1.__metadata("design:type", Number)
    ], PhotoMetadata.prototype, "width", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PhotoMetadata.prototype, "orientation", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], PhotoMetadata.prototype, "compressed", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PhotoMetadata.prototype, "comment", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return Photo_1.Photo; }, function (photo) { return photo.metadata; }),
        tslib_1.__metadata("design:type", Photo_1.Photo)
    ], PhotoMetadata.prototype, "photo", void 0);
    PhotoMetadata = tslib_1.__decorate([
        index_1.Entity()
    ], PhotoMetadata);
    return PhotoMetadata;
}());
exports.PhotoMetadata = PhotoMetadata;
//# sourceMappingURL=PhotoMetadata.js.map