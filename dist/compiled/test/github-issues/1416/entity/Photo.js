"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var PhotoMetadata_1 = require("./PhotoMetadata");
var Author_1 = require("./Author");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column({
            length: 500,
        }),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "name", void 0);
    tslib_1.__decorate([
        index_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "description", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "filename", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Photo.prototype, "isPublished", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Author_1.Author; }, function (author) { return author.photos; }),
        tslib_1.__metadata("design:type", Author_1.Author)
    ], Photo.prototype, "author", void 0);
    tslib_1.__decorate([
        index_1.OneToOne(function (type) { return PhotoMetadata_1.PhotoMetadata; }, function (photoMetadata) { return photoMetadata.photo; }, { eager: true }),
        index_1.JoinColumn(),
        tslib_1.__metadata("design:type", PhotoMetadata_1.PhotoMetadata)
    ], Photo.prototype, "metadata", void 0);
    Photo = tslib_1.__decorate([
        index_1.Entity()
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map