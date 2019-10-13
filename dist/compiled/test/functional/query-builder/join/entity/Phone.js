"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var User_1 = require("./User");
var src_1 = require("../../../../../src");
var Phone = /** @class */ (function () {
    function Phone() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Phone.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return User_1.User; }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Phone.prototype, "user", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Phone.prototype, "number", void 0);
    Phone = tslib_1.__decorate([
        src_1.Entity()
    ], Phone);
    return Phone;
}());
exports.Phone = Phone;
//# sourceMappingURL=Phone.js.map