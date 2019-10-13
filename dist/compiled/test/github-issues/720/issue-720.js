"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Participant_1 = require("./entity/Participant");
var chai_1 = require("chai");
var Message_1 = require("./entity/Message");
var Translation_1 = require("./entity/Translation");
var Locale_1 = require("./entity/Locale");
describe("github issues > #720 `.save()` not updating composite key with Postgres", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should not insert new entity when entity already exist with same primary keys", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var participants, count1, updatedParticipants, count2, loadedParticipant1, loadedParticipant2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    participants = [];
                    participants[0] = new Participant_1.Participant();
                    participants[0].order_id = 1;
                    participants[0].distance = "one";
                    participants[0].price = "100$";
                    participants[1] = new Participant_1.Participant();
                    participants[1].order_id = 1;
                    participants[1].distance = "two";
                    participants[1].price = "200$";
                    participants[2] = new Participant_1.Participant();
                    participants[2].order_id = 1;
                    participants[2].distance = "three";
                    participants[2].price = "300$";
                    return [4 /*yield*/, connection.manager.save(participants)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.count(Participant_1.Participant)];
                case 2:
                    count1 = _a.sent();
                    chai_1.expect(count1).to.be.equal(3);
                    updatedParticipants = [];
                    updatedParticipants[0] = new Participant_1.Participant();
                    updatedParticipants[0].order_id = 1;
                    updatedParticipants[0].distance = "one";
                    updatedParticipants[0].price = "150$";
                    updatedParticipants[1] = new Participant_1.Participant();
                    updatedParticipants[1].order_id = 1;
                    updatedParticipants[1].distance = "two";
                    updatedParticipants[1].price = "250$";
                    return [4 /*yield*/, connection.manager.save(updatedParticipants)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.count(Participant_1.Participant)];
                case 4:
                    count2 = _a.sent();
                    chai_1.expect(count2).to.be.equal(3);
                    return [4 /*yield*/, connection.manager.findOne(Participant_1.Participant, { order_id: 1, distance: "one" })];
                case 5:
                    loadedParticipant1 = _a.sent();
                    chai_1.expect(loadedParticipant1.order_id).to.be.equal(1);
                    chai_1.expect(loadedParticipant1.distance).to.be.equal("one");
                    chai_1.expect(loadedParticipant1.price).to.be.equal("150$");
                    return [4 /*yield*/, connection.manager.findOne(Participant_1.Participant, { order_id: 1, distance: "two" })];
                case 6:
                    loadedParticipant2 = _a.sent();
                    chai_1.expect(loadedParticipant2.order_id).to.be.equal(1);
                    chai_1.expect(loadedParticipant2.distance).to.be.equal("two");
                    chai_1.expect(loadedParticipant2.price).to.be.equal("250$");
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("reproducing second comment issue", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var message, locale, translation, foundTranslation;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    message = new Message_1.Message();
                    return [4 /*yield*/, connection.manager.save(message)];
                case 1:
                    _a.sent();
                    locale = new Locale_1.Locale();
                    locale.code = "US";
                    locale.englishName = "USA";
                    locale.name = message;
                    return [4 /*yield*/, connection.manager.save(locale)];
                case 2:
                    _a.sent();
                    translation = new Translation_1.Translation();
                    translation.message = message;
                    translation.locale = locale;
                    translation.text = "Some Text";
                    return [4 /*yield*/, connection.manager.save(translation)];
                case 3:
                    _a.sent();
                    // change its text and save again
                    translation.text = "Changed Text";
                    return [4 /*yield*/, connection.manager.save(translation)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.getRepository(Translation_1.Translation).findOne({
                            locale: {
                                code: "US"
                            },
                            message: {
                                id: "1"
                            }
                        })];
                case 5:
                    foundTranslation = _a.sent();
                    chai_1.expect(foundTranslation).to.be.eql({
                        text: "Changed Text"
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-720.js.map