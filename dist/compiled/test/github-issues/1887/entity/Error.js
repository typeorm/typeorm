"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Error = /** @class */ (function () {
    function Error() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Error.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("uniqueidentifier", { nullable: false }),
        tslib_1.__metadata("design:type", String)
    ], Error.prototype, "executionGuid", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Error.prototype, "errorNumber", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Error.prototype, "errorDescription", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], Error.prototype, "errorDate", void 0);
    Error = tslib_1.__decorate([
        src_1.Entity("Error")
    ], Error);
    return Error;
}());
exports.Error = Error;
//# sourceMappingURL=Error.js.map