"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Unique_1 = require("../../../../src/decorator/Unique");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Index_1 = require("../../../../src/decorator/Index");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        Index_1.Index({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "tag", void 0);
    tslib_1.__decorate([
        Column_1.Column({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "description", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "text", void 0);
    Photo = tslib_1.__decorate([
        Entity_1.Entity(),
        Unique_1.Unique(["name"]),
        Index_1.Index(["text"], { unique: true })
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map