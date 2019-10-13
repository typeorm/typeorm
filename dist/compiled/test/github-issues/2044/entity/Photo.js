"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var User_1 = require("./User");
var string_decoder_1 = require("string_decoder");
var Photo = /** @class */ (function () {
    function Photo() {
    }
    Object.defineProperty(Photo.prototype, "id", {
        get: function () {
            var decoder = new string_decoder_1.StringDecoder("hex");
            return decoder.end(this._id);
        },
        set: function (value) {
            this._id = Buffer.from(value, "hex");
        },
        enumerable: true,
        configurable: true
    });
    tslib_1.__decorate([
        src_1.PrimaryColumn("binary", {
            length: 2
        }),
        tslib_1.__metadata("design:type", Buffer)
    ], Photo.prototype, "_id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Photo.prototype, "description", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return User_1.User; }, function (user) { return user.photos; }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Photo.prototype, "user", void 0);
    Photo = tslib_1.__decorate([
        src_1.Entity()
    ], Photo);
    return Photo;
}());
exports.Photo = Photo;
//# sourceMappingURL=Photo.js.map