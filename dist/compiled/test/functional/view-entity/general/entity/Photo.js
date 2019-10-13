"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../../src");
var src_2 = require("../../../../../src");
var src_3 = require("../../../../../src");
var src_4 = require("../../../../../src");
var src_5 = require("../../../../../src");
var Album_1 = require("./Album");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    tslib_1.__decorate([
        src_3.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "name", void 0);
    tslib_1.__decorate([
        src_2.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "albumId", void 0);
    tslib_1.__decorate([
        src_4.ManyToOne(function () { return Album_1.Album; }),
        src_5.JoinColumn({ name: "albumId" }),
        tslib_1.__metadata("design:type", Album_1.Album)
    ], Photo.prototype, "album", void 0);
    Photo = tslib_1.__decorate([
        src_1.Entity()
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map