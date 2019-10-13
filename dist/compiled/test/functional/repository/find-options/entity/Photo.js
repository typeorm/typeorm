"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var index_1 = require("../../../../../src/index");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Category_1 = require("./Category");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column({
            length: 500
        }),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "description", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "filename", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "views", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Photo.prototype, "isPublished", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Category_1.Category; }),
        index_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Photo.prototype, "categories", void 0);
    Photo = tslib_1.__decorate([
        Entity_1.Entity()
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map