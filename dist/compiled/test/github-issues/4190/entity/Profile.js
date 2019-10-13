"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Profile = /** @class */ (function () {
    function Profile() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Profile.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Profile.prototype, "gender", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Profile.prototype, "photo", void 0);
    Profile = tslib_1.__decorate([
        src_1.Entity()
    ], Profile);
    return Profile;
}());
exports.Profile = Profile;
//# sourceMappingURL=Profile.js.map