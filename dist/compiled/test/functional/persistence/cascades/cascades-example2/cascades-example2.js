"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../../utils/test-utils");
var Question_1 = require("./entity/Question");
var Answer_1 = require("./entity/Answer");
var Photo_1 = require("./entity/Photo");
var User_1 = require("./entity/User");
describe("persistence > cascades > example 2", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should insert everything by cascades properly", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var photo, user, answer1, answer2, question, loadedQuestion;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    photo = new Photo_1.Photo();
                    user = new User_1.User();
                    answer1 = new Answer_1.Answer();
                    answer1.photo = photo;
                    answer1.user = user;
                    answer2 = new Answer_1.Answer();
                    answer2.photo = photo;
                    answer2.user = user;
                    question = new Question_1.Question();
                    question.answers = [answer1, answer2];
                    user.question = question;
                    return [4 /*yield*/, connection.manager.save(question)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Question_1.Question, "question")
                            .leftJoinAndSelect("question.answers", "answer")
                            .leftJoinAndSelect("answer.photo", "answerPhoto")
                            .leftJoinAndSelect("answer.user", "answerUser")
                            .leftJoinAndSelect("answerUser.question", "userQuestion")
                            .getOne()];
                case 2:
                    loadedQuestion = _a.sent();
                    loadedQuestion.should.be.eql({
                        id: 1,
                        answers: [{
                                id: 1,
                                photo: {
                                    id: 1
                                },
                                user: {
                                    id: 1,
                                    question: {
                                        id: 1
                                    }
                                }
                            }, {
                                id: 2,
                                photo: {
                                    id: 1
                                },
                                user: {
                                    id: 1,
                                    question: {
                                        id: 1
                                    }
                                }
                            }]
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=cascades-example2.js.map