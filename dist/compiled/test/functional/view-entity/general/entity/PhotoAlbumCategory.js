"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var ViewColumn_1 = require("../../../../../src/decorator/columns/ViewColumn");
var ViewEntity_1 = require("../../../../../src/decorator/entity-view/ViewEntity");
var Album_1 = require("./Album");
var Category_1 = require("./Category");
var Photo_1 = require("./Photo");
var PhotoAlbumCategory = /** @class */ (function () {
    function PhotoAlbumCategory() {
    }
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PhotoAlbumCategory.prototype, "id", void 0);
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", String)
    ], PhotoAlbumCategory.prototype, "name", void 0);
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", String)
    ], PhotoAlbumCategory.prototype, "categoryName", void 0);
    tslib_1.__decorate([
        ViewColumn_1.ViewColumn(),
        tslib_1.__metadata("design:type", String)
    ], PhotoAlbumCategory.prototype, "albumName", void 0);
    PhotoAlbumCategory = tslib_1.__decorate([
        ViewEntity_1.ViewEntity({
            expression: function (connection) { return connection.createQueryBuilder()
                .select("photo.id", "id")
                .addSelect("photo.name", "name")
                .addSelect("category.name", "categoryName")
                .addSelect("album.name", "albumName")
                .from(Photo_1.Photo, "photo")
                .leftJoin(Album_1.Album, "album", "album.id = photo.albumId")
                .leftJoin(Category_1.Category, "category", "category.id = album.categoryId")
                .where("category.name = 'Cars'"); }
        })
    ], PhotoAlbumCategory);
    return PhotoAlbumCategory;
}());
exports.PhotoAlbumCategory = PhotoAlbumCategory;
//# sourceMappingURL=PhotoAlbumCategory.js.map