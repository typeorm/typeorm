"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../../src/decorator/Index");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometry", {
            nullable: true
        }),
        Index_1.Index({
            spatial: true
        }),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "geom", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometry", {
            nullable: true,
            spatialFeatureType: "Point"
        }),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "pointWithoutSRID", void 0);
    tslib_1.__decorate([
        Column_1.Column("geometry", {
            nullable: true,
            spatialFeatureType: "Point",
            srid: 4326
        }),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "point", void 0);
    tslib_1.__decorate([
        Column_1.Column("geography", {
            nullable: true
        }),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "geog", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map