"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Message_1 = require("./Message");
var User_1 = require("./User");
var Recipient = /** @class */ (function () {
    function Recipient(_a) {
        var _b = _a === void 0 ? {} : _a, user = _b.user, message = _b.message, receivedAt = _b.receivedAt, readAt = _b.readAt;
        if (user) {
            this.user = user;
        }
        if (message) {
            this.message = message;
        }
        if (receivedAt) {
            this.receivedAt = receivedAt;
        }
        if (readAt) {
            this.readAt = readAt;
        }
    }
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return User_1.User; }, function (user) { return user.recipients; }, { primary: true }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Recipient.prototype, "user", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Message_1.Message; }, function (message) { return message.recipients; }, { primary: true }),
        tslib_1.__metadata("design:type", Message_1.Message)
    ], Recipient.prototype, "message", void 0);
    tslib_1.__decorate([
        index_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Recipient.prototype, "receivedAt", void 0);
    tslib_1.__decorate([
        index_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Recipient.prototype, "readAt", void 0);
    Recipient = tslib_1.__decorate([
        index_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], Recipient);
    return Recipient;
}());
exports.Recipient = Recipient;
//# sourceMappingURL=Recipient.js.map