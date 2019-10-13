"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var SessionSettings_1 = require("./SessionSettings");
var Session = /** @class */ (function () {
    function Session() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Session.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Session.prototype, "title", void 0);
    tslib_1.__decorate([
        src_1.Column({
            nullable: true
        }),
        tslib_1.__metadata("design:type", String)
    ], Session.prototype, "description", void 0);
    tslib_1.__decorate([
        src_1.OneToOne(function (type) { return SessionSettings_1.SessionSettings; }, function (sessionSettings) { return sessionSettings.session; }),
        tslib_1.__metadata("design:type", SessionSettings_1.SessionSettings)
    ], Session.prototype, "settings", void 0);
    Session = tslib_1.__decorate([
        src_1.Entity({
            name: "Sessions"
        })
    ], Session);
    return Session;
}());
exports.Session = Session;
//# sourceMappingURL=Session.js.map