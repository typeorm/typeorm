"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Message_1 = require("./entity/Message");
var Recipient_1 = require("./entity/Recipient");
var User_1 = require("./entity/User");
var Chat_1 = require("./entity/Chat");
describe("github issues > #1551 complex example of cascades + multiple primary keys = persistence order", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname, enabledDrivers: ["mysql"] })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("throws an error because there is no object id defined", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user5, messages, recipients;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User({
                        username: "ethan",
                        password: "$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm",
                        name: "Ethan Gonzalez",
                        picture: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
                        phone: "+391234567890",
                    });
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user5 = new User_1.User({
                        username: "ray",
                        password: "$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242",
                        name: "Ray Edwards",
                        picture: "https://randomuser.me/api/portraits/thumb/men/3.jpg",
                        phone: "+391234567894",
                    });
                    return [4 /*yield*/, connection.manager.save(user5)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(new Chat_1.Chat({
                            allTimeMembers: [user1, user5],
                            listingMembers: [user1, user5],
                            messages: [
                                new Message_1.Message({
                                    sender: user1,
                                    content: "I should buy a boat",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                                new Message_1.Message({
                                    sender: user1,
                                    content: "You still there?",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                            ],
                        }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.find(Message_1.Message)];
                case 4:
                    messages = _a.sent();
                    messages[0].recipients.length.should.be.equal(1);
                    messages[1].recipients.length.should.be.equal(1);
                    return [4 /*yield*/, connection.manager.find(Recipient_1.Recipient)];
                case 5:
                    recipients = _a.sent();
                    recipients.length.should.be.equal(2);
                    return [2 /*return*/];
            }
        });
    }); })); });
    // cascade remove are not supported
    it.skip("throws a \"update or delete on table 'message' violates foreign key constraint on table 'recipient'\" error on delete", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user5, message, messages, recipients;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User({
                        username: "ethan",
                        password: "$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm",
                        name: "Ethan Gonzalez",
                        picture: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
                        phone: "+391234567890",
                    });
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user5 = new User_1.User({
                        username: "ray",
                        password: "$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242",
                        name: "Ray Edwards",
                        picture: "https://randomuser.me/api/portraits/thumb/men/3.jpg",
                        phone: "+391234567894",
                    });
                    return [4 /*yield*/, connection.manager.save(user5)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(new Chat_1.Chat({
                            allTimeMembers: [user1, user5],
                            listingMembers: [user1, user5],
                            messages: [
                                new Message_1.Message({
                                    sender: user1,
                                    content: "I should buy a boat",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                                new Message_1.Message({
                                    sender: user1,
                                    content: "You still there?",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                            ],
                        }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .createQueryBuilder(Message_1.Message, "message")
                            .getOne()];
                case 4:
                    message = _a.sent();
                    if (!message) return [3 /*break*/, 6];
                    return [4 /*yield*/, connection.getRepository(Message_1.Message).remove(message)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6: throw new Error("Cannot get message");
                case 7: return [4 /*yield*/, connection.manager.find(Message_1.Message)];
                case 8:
                    messages = _a.sent();
                    messages.length.should.be.equal(0);
                    return [4 /*yield*/, connection.manager.find(Recipient_1.Recipient)];
                case 9:
                    recipients = _a.sent();
                    recipients.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
    // cascade remove are not supported
    it.skip("throws a \"null value in column 'userId' violates not-null constraint\" error on delete", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, user5, message, messages, recipients;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user1 = new User_1.User({
                        username: "ethan",
                        password: "$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm",
                        name: "Ethan Gonzalez",
                        picture: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
                        phone: "+391234567890",
                    });
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _a.sent();
                    user5 = new User_1.User({
                        username: "ray",
                        password: "$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242",
                        name: "Ray Edwards",
                        picture: "https://randomuser.me/api/portraits/thumb/men/3.jpg",
                        phone: "+391234567894",
                    });
                    return [4 /*yield*/, connection.manager.save(user5)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(new Chat_1.Chat({
                            allTimeMembers: [user1, user5],
                            listingMembers: [user1, user5],
                            messages: [
                                new Message_1.Message({
                                    sender: user1,
                                    content: "I should buy a boat",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                                new Message_1.Message({
                                    sender: user1,
                                    content: "You still there?",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                            ],
                        }))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Message_1.Message)];
                case 4:
                    message = _a.sent();
                    if (!message) return [3 /*break*/, 6];
                    return [4 /*yield*/, connection.getRepository(Message_1.Message).remove(message)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 7];
                case 6: throw new Error("Cannot get message");
                case 7: return [4 /*yield*/, connection.manager.find(Message_1.Message)];
                case 8:
                    messages = _a.sent();
                    messages.length.should.be.equal(0);
                    return [4 /*yield*/, connection.manager.find(Recipient_1.Recipient)];
                case 9:
                    recipients = _a.sent();
                    recipients.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
    // cascade remove are not supported
    it.skip("throws a \"Subject Recipient must have an identifier to perform operation\" internal error on delete", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var e_1, _a, user1, user5, recipients, recipients_1, recipients_1_1, recipient, e_1_1;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    user1 = new User_1.User({
                        username: "ethan",
                        password: "$2a$08$NO9tkFLCoSqX1c5wk3s7z.JfxaVMKA.m7zUDdDwEquo4rvzimQeJm",
                        name: "Ethan Gonzalez",
                        picture: "https://randomuser.me/api/portraits/thumb/men/1.jpg",
                        phone: "+391234567890",
                    });
                    return [4 /*yield*/, connection.manager.save(user1)];
                case 1:
                    _b.sent();
                    user5 = new User_1.User({
                        username: "ray",
                        password: "$2a$08$6.mbXqsDX82ZZ7q5d8Osb..JrGSsNp4R3IKj7mxgF6YGT0OmMw242",
                        name: "Ray Edwards",
                        picture: "https://randomuser.me/api/portraits/thumb/men/3.jpg",
                        phone: "+391234567894",
                    });
                    return [4 /*yield*/, connection.manager.save(user5)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, connection.manager.save(new Chat_1.Chat({
                            allTimeMembers: [user1, user5],
                            listingMembers: [user1, user5],
                            messages: [
                                new Message_1.Message({
                                    sender: user1,
                                    content: "I should buy a boat",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                                new Message_1.Message({
                                    sender: user1,
                                    content: "You still there?",
                                    type: Message_1.MessageType.TEXT,
                                    holders: [user1, user5],
                                    recipients: [
                                        new Recipient_1.Recipient({
                                            user: user5,
                                        }),
                                    ],
                                }),
                            ],
                        }))];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, connection.manager.find(Recipient_1.Recipient)];
                case 4:
                    recipients = _b.sent();
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 10, 11, 12]);
                    recipients_1 = tslib_1.__values(recipients), recipients_1_1 = recipients_1.next();
                    _b.label = 6;
                case 6:
                    if (!!recipients_1_1.done) return [3 /*break*/, 9];
                    recipient = recipients_1_1.value;
                    return [4 /*yield*/, connection.getRepository(Recipient_1.Recipient).remove(recipient)];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    recipients_1_1 = recipients_1.next();
                    return [3 /*break*/, 6];
                case 9: return [3 /*break*/, 12];
                case 10:
                    e_1_1 = _b.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 11:
                    try {
                        if (recipients_1_1 && !recipients_1_1.done && (_a = recipients_1.return)) _a.call(recipients_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                    return [7 /*endfinally*/];
                case 12: return [4 /*yield*/, connection.manager.find(Recipient_1.Recipient)];
                case 13:
                    recipients = _b.sent();
                    recipients.length.should.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1551.js.map