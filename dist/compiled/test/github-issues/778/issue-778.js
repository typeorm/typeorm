"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var Question_1 = require("./entity/Question");
describe("github issues > #778 TypeORM is ignoring the `type` field when set on a PrimaryGeneratedColumn", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly parse type from PrimaryGeneratedColumn options", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, postTable, categoryTable, questionTable, post, category, question;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    postTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("category")];
                case 2:
                    categoryTable = _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("question")];
                case 3:
                    questionTable = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 4:
                    _a.sent();
                    post = new Post_1.Post();
                    post.name = "Post #1";
                    return [4 /*yield*/, connection.getRepository(Post_1.Post).save(post)];
                case 5:
                    _a.sent();
                    category = new Category_1.Category();
                    category.name = "Category #1";
                    return [4 /*yield*/, connection.getRepository(Category_1.Category).save(category)];
                case 6:
                    _a.sent();
                    question = new Question_1.Question();
                    question.name = "Question #1";
                    return [4 /*yield*/, connection.getRepository(Question_1.Question).save(question)];
                case 7:
                    _a.sent();
                    postTable.findColumnByName("id").type.should.be.equal("integer");
                    categoryTable.findColumnByName("id").type.should.be.equal("bigint");
                    questionTable.findColumnByName("id").type.should.be.equal("smallint");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-778.js.map