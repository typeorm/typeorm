"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var src_3 = require("../../../../src");
var User = /** @class */ (function () {
    function User() {
    }
    tslib_1.__decorate([
        src_3.PrimaryColumn({
            type: "int4",
            unique: true,
            name: "id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "id", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "citext",
            unique: true,
            name: "nick_name"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "nickName", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "varchar",
            nullable: true,
            name: "first_name"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "firstName", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "varchar",
            nullable: true,
            name: "last_name"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "lastName", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "timestamptz",
            nullable: true,
            name: "birthday"
        }),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "birthday", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "timestamptz",
            default: "now()",
            name: "created_at"
        }),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "createdAt", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "varchar",
            nullable: true,
            name: "phone"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "phone", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "varchar",
            nullable: true,
            name: "email"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "email", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "false",
            name: "phone_confirmed"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "phoneConfirmed", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "false",
            name: "email_confirmed"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "emailConfirmed", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "timestamptz",
            default: "now()",
            name: "last_activity"
        }),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "lastActivity", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "varchar",
            nullable: true,
            name: "link"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "link", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "varchar",
            nullable: true,
            name: "avatar"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "avatar", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            nullable: true,
            name: "city_id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "cityID", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "varchar",
            nullable: true,
            name: "avatar_url"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "avatarUrl", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int2",
            default: "0",
            name: "friends_count"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "friendsCount", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            default: "0",
            name: "unread_notifications_count"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "unreadNotificationsCount", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "false",
            name: "verified"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "verified", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int8",
            nullable: true,
            name: "fb_id"
        }),
        tslib_1.__metadata("design:type", String)
    ], User.prototype, "fbID", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            nullable: true,
            name: "vk_id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "vkID", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            nullable: true,
            name: "twitch_id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "twitchID", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "false",
            name: "is_completed_registration"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "isCompletedRegistration", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "true",
            name: "online"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "online", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            default: "0",
            name: "unread_messages_count"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "unreadMessagesCount", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "timestamptz",
            default: "now()",
            name: "notification_last_read_at"
        }),
        tslib_1.__metadata("design:type", Date)
    ], User.prototype, "notificationLastReadAt", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            nullable: true,
            name: "prefer_region_id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "preferRegionID", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "false",
            name: "auto_connect"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "autoConnect", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "true",
            name: "receive_email_notifications"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "receiveEmailNotifications", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "bool",
            default: "false",
            name: "is_mobile"
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], User.prototype, "isMobile", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            default: "0",
            name: "unread_dialogs_count"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "unreadDialogsCount", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            default: "0",
            name: "friends_invites_count"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "friendsInvitesCount", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int2",
            default: function () { return "'1'::smallint"; },
            name: "region_id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "regionID", void 0);
    tslib_1.__decorate([
        src_2.Column({
            type: "int4",
            nullable: true,
            name: "instagram_id"
        }),
        tslib_1.__metadata("design:type", Number)
    ], User.prototype, "instagramID", void 0);
    User = tslib_1.__decorate([
        src_1.Entity()
    ], User);
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map