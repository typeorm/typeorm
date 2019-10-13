"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var Index_1 = require("../../../../../src/decorator/Index");
var Profile = /** @class */ (function () {
    function Profile() {
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Profile.prototype, "job", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        Index_1.Index("customer_profile_address"),
        tslib_1.__metadata("design:type", String)
    ], Profile.prototype, "address", void 0);
    return Profile;
}());
exports.Profile = Profile;
//# sourceMappingURL=Profile.js.map