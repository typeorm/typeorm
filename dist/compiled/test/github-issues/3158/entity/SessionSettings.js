"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Session_1 = require("./Session");
var SessionSettings = /** @class */ (function () {
    function SessionSettings() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], SessionSettings.prototype, "sessionId", void 0);
    tslib_1.__decorate([
        src_1.OneToOne(function (type) { return Session_1.Session; }, function (session) { return session.id; }),
        src_1.JoinColumn({ name: "sessionId", referencedColumnName: "id" }),
        tslib_1.__metadata("design:type", Session_1.Session)
    ], SessionSettings.prototype, "session", void 0);
    SessionSettings = tslib_1.__decorate([
        src_1.Entity({
            name: "SessionSettings"
        })
    ], SessionSettings);
    return SessionSettings;
}());
exports.SessionSettings = SessionSettings;
//# sourceMappingURL=SessionSettings.js.map