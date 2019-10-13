"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Chat_1 = require("./Chat");
var Message_1 = require("./Message");
var Recipient_1 = require("./Recipient");
var User = /** @class */ (function () {
    function User(_a) {
        var _b = _a === void 0 ? {} : _a, username = _b.username, password = _b.password, name = _b.name, picture = _b.picture, phone = _b.phone;
        if (username) {
            this.username = username;
        }
        if (password) {
            this.password = password;
        }
        if (name) {
            this.name = name;
        }
        if (picture) {
            this.picture = picture;
        }
        if (phone) {
            this.phone = phone;
        }
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "username", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "password", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "name", void 0);
    tslib_1.__decorate([
        index_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "picture", void 0);
    tslib_1.__decorate([
        index_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "phone", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Chat_1.Chat; }, function (chat) { return chat.allTimeMembers; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "allTimeMemberChats", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Chat_1.Chat; }, function (chat) { return chat.listingMembers; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "listedMemberChats", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Chat_1.Chat; }, function (chat) { return chat.actualGroupMembers; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "actualGroupMemberChats", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Chat_1.Chat; }, function (chat) { return chat.admins; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "adminChats", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return Message_1.Message; }, function (message) { return message.holders; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "holderMessages", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Chat_1.Chat; }, function (chat) { return chat.owner; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "ownerChats", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Message_1.Message; }, function (message) { return message.sender; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "senderMessages", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Recipient_1.Recipient; }, function (recipient) { return recipient.user; }),
        tslib_1.__metadata("design:type", Array)
    ], User.prototype, "recipients", void 0);
    User = tslib_1.__decorate([
        index_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map