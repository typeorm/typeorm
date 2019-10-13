"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Photo_1 = require("./Photo");
var string_decoder_1 = require("string_decoder");
var User = /** @class */ (function () {
    function User() {
    }
    Object.defineProperty(User.prototype, "id", {
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
    ], User.prototype, "_id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "age", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function (type) { return Photo_1.Photo; }, function (photo) { return photo.user; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "photos", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map