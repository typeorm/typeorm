"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var src_2 = require("../../../../../src");
var src_3 = require("../../../../../src");
var Category_1 = require("./Category");
var Album = /** @class */ (function () {
    function Album() {
    }
    tslib_1.__decorate([
        src_3.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Album.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", String)
    ], Album.prototype, "name", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Album.prototype, "categoryId", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function () { return Category_1.Category; }),
        src_1.JoinColumn({ name: "categoryId" }),
        tslib_1.__metadata("design:type", Category_1.Category)
    ], Album.prototype, "category", void 0);
    Album = tslib_1.__decorate([
        src_1.Entity()
    ], Album);
    return Album;
}());
exports.Album = Album;
//# sourceMappingURL=Album.js.map