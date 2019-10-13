"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Message_1 = require("./Message");
var User_1 = require("./User");
var Chat = /** @class */ (function () {
    function Chat(_a) {
        var _b = _a === void 0 ? {} : _a, name = _b.name, picture = _b.picture, allTimeMembers = _b.allTimeMembers, listingMembers = _b.listingMembers, actualGroupMembers = _b.actualGroupMembers, admins = _b.admins, owner = _b.owner, messages = _b.messages;
        if (name) {
            this.name = name;
        }
        if (picture) {
            this.picture = picture;
        }
        if (allTimeMembers) {
            this.allTimeMembers = allTimeMembers;
        }
        if (listingMembers) {
            this.listingMembers = listingMembers;
        }
        if (actualGroupMembers) {
            this.actualGroupMembers = actualGroupMembers;
        }
        if (admins) {
            this.admins = admins;
        }
        if (owner) {
            this.owner = owner;
        }
        if (messages) {
            this.messages = messages;
        }
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Chat.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], Chat.prototype, "name", void 0);
    tslib_1.__decorate([
        index_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], Chat.prototype, "picture", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function () { return User_1.User; }, function (user) { return user.allTimeMemberChats; }, { eager: true }),
        index_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Chat.prototype, "allTimeMembers", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function () { return User_1.User; }, function (user) { return user.listedMemberChats; }, { eager: true }),
        index_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Chat.prototype, "listingMembers", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function () { return User_1.User; }, function (user) { return user.actualGroupMemberChats; }, { eager: true }),
        index_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Chat.prototype, "actualGroupMembers", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function () { return User_1.User; }, function (user) { return user.adminChats; }, { eager: true }),
        index_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Chat.prototype, "admins", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function () { return User_1.User; }, function (user) { return user.ownerChats; }, { eager: true }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Chat.prototype, "owner", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function () { return Message_1.Message; }, function (message) { return message.chat; }, { cascade: true, eager: true }),
        tslib_1.__metadata("design:type", Array)
    ], Chat.prototype, "messages", void 0);
    Chat = tslib_1.__decorate([
        index_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], Chat);
    return Chat;
}());
exports.Chat = Chat;
//# sourceMappingURL=Chat.js.map