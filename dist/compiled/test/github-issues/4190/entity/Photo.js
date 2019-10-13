"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var User_1 = require("./User");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Photo.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "url", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne("User", "photos"),
        tslib_1.__metadata("design:type", User_1.User)
    ], Photo.prototype, "user", void 0);
    Photo = tslib_1.__decorate([
        src_1.Entity()
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map