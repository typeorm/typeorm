"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var SpecificUser = /** @class */ (function () {
    function SpecificUser() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], SpecificUser.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], SpecificUser.prototype, "name", void 0);
    SpecificUser = tslib_1.__decorate([
        index_1.Entity("user", { database: "db_2" })
    ], SpecificUser);
    return SpecificUser;
}());
exports.SpecificUser = SpecificUser;
//# sourceMappingURL=SpecificUser.js.map