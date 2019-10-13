"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Question_1 = require("./entity/Question");
var Post_1 = require("./entity/Post");
describe("uuid-mssql", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mssql"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist uuid correctly when it is generated non primary column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, questionRepository, queryRunner, postTable, questionTable, post, loadedPost, post2, loadedPost2, question, savedQuestion, loadedQuestion, question2, loadedQuestion2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    questionRepository = connection.getRepository(Question_1.Question);
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    postTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 2:
                    questionTable = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    post = new Post_1.Post();
                    return [4 /*yield*/, postRepository.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(1)];
                case 5:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.uuid).to.be.exist;
                    postTable.findColumnByName("uuid").type.should.be.equal("uniqueidentifier");
                    post2 = new Post_1.Post();
                    post2.uuid = "FD357B8F-8838-42F6-B7A2-AE027444E895";
                    return [4 /*yield*/, postRepository.save(post2)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(2)];
                case 7:
                    loadedPost2 = _a.sent();
                    chai_1.expect(loadedPost2.uuid).to.equal("FD357B8F-8838-42F6-B7A2-AE027444E895");
                    question = new Question_1.Question();
                    return [4 /*yield*/, questionRepository.save(question)];
                case 8:
                    savedQuestion = _a.sent();
                    return [4 /*yield*/, questionRepository.findOne(savedQuestion.id)];
                case 9:
                    loadedQuestion = _a.sent();
                    chai_1.expect(loadedQuestion.id).to.be.exist;
                    chai_1.expect(loadedQuestion.uuid).to.be.exist;
                    chai_1.expect(loadedQuestion.uuid2).to.be.null;
                    chai_1.expect(loadedQuestion.uuid3).to.be.exist;
                    questionTable.findColumnByName("id").type.should.be.equal("uniqueidentifier");
                    questionTable.findColumnByName("uuid").type.should.be.equal("uniqueidentifier");
                    questionTable.findColumnByName("uuid2").type.should.be.equal("uniqueidentifier");
                    questionTable.findColumnByName("uuid3").type.should.be.equal("uniqueidentifier");
                    question2 = new Question_1.Question();
                    question2.id = "1ECAD7F6-23EE-453E-BB44-16ECA26D5189";
                    question2.uuid = "35B44650-B2CD-44EC-AA54-137FBDF1C373";
                    question2.uuid2 = null;
                    question2.uuid3 = null;
                    return [4 /*yield*/, questionRepository.save(question2)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, questionRepository.findOne("1ECAD7F6-23EE-453E-BB44-16ECA26D5189")];
                case 11:
                    loadedQuestion2 = _a.sent();
                    chai_1.expect(loadedQuestion2.id).to.equal("1ECAD7F6-23EE-453E-BB44-16ECA26D5189");
                    chai_1.expect(loadedQuestion2.uuid).to.equal("35B44650-B2CD-44EC-AA54-137FBDF1C373");
                    chai_1.expect(loadedQuestion2.uuid2).to.be.null;
                    chai_1.expect(loadedQuestion2.uuid3).to.be.null;
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=uuid-mssql.js.map