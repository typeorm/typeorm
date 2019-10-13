"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Chat_1 = require("./Chat");
var User_1 = require("./User");
var Recipient_1 = require("./Recipient");
var index_1 = require("../../../../src/index");
var MessageType;
(function (MessageType) {
    MessageType[MessageType["TEXT"] = 0] = "TEXT";
    MessageType[MessageType["LOCATION"] = 1] = "LOCATION";
    MessageType[MessageType["PICTURE"] = 2] = "PICTURE";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var Message = /** @class */ (function () {
    function Message(_a) {
        var _b = _a === void 0 ? {} : _a, sender = _b.sender, content = _b.content, type = _b.type, recipients = _b.recipients, holders = _b.holders, chat = _b.chat;
        var _this = this;
        if (sender) {
            this.sender = sender;
        }
        if (content) {
            this.content = content;
        }
        if (type) {
            this.type = type;
        }
        if (recipients) {
            recipients.forEach(function (recipient) { return recipient.message = _this; });
            this.recipients = recipients;
            // this.recipients = recipients.map(recipient => (new Recipient({...recipient, message: this})));
        }
        if (holders) {
            this.holders = holders;
        }
        if (chat) {
            this.chat = chat;
        }
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Message.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return User_1.User; }, function (user) { return user.senderMessages; }, { eager: true }),
        tslib_1.__metadata("design:type", User_1.User)
    ], Message.prototype, "sender", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Message.prototype, "content", void 0);
    tslib_1.__decorate([
        index_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Message.prototype, "createdAt", void 0);
    tslib_1.__decorate([
        index_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], Message.prototype, "type", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Recipient_1.Recipient; }, function (recipient) { return recipient.message; }, { cascade: true, eager: true }),
        tslib_1.__metadata("design:type", Array)
    ], Message.prototype, "recipients", void 0);
    tslib_1.__decorate([
        index_1.ManyToMany(function (type) { return User_1.User; }, function (user) { return user.holderMessages; }, { eager: true }),
        index_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Message.prototype, "holders", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Chat_1.Chat; }, function (chat) { return chat.messages; }),
        tslib_1.__metadata("design:type", Chat_1.Chat)
    ], Message.prototype, "chat", void 0);
    Message = tslib_1.__decorate([
        index_1.Entity(),
        tslib_1.__metadata("design:paramtypes", [Object])
    ], Message);
    return Message;
}());
exports.Message = Message;
//# sourceMappingURL=Message.js.map