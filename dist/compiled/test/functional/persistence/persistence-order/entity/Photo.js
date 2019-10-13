"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Post_1 = require("./Post");
var OneToOne_1 = require("../../../../../src/decorator/relations/OneToOne");
var JoinColumn_1 = require("../../../../../src/decorator/relations/JoinColumn");
var Details_1 = require("./Details");
var Category_1 = require("./Category");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Details_1.Details; }, function (details) { return details.photo; }),
        tslib_1.__metadata("design:type", Details_1.Details)
    ], Photo.prototype, "details", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Post_1.Post; }, function (post) { return post.photo; }, {
            nullable: false
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Post_1.Post)
    ], Photo.prototype, "post", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Category_1.Category; }, {
            nullable: false
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Photo.prototype, "category", void 0);
    Photo = tslib_1.__decorate([
        Entity_1.Entity()
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map