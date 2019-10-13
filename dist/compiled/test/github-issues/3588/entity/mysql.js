"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Session = /** @class */ (function () {
    function Session() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Session.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "timestamp",
            precision: 3,
            default: function () { return "CURRENT_TIMESTAMP(3)"; },
            onUpdate: "CURRENT_TIMESTAMP(3)",
        }),
        tslib_1.__metadata("design:type", Date)
    ], Session.prototype, "ts", void 0);
    Session = tslib_1.__decorate([
        src_1.Entity({ name: "Session" })
    ], Session);
    return Session;
}());
exports.Session = Session;
//# sourceMappingURL=mysql.js.map