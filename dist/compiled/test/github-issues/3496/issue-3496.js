"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var src_1 = require("../../../src");
describe("github issues > #3496 jsonb comparison doesn't work", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("the entity should not be updated a second time", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repository, problems, post, savedPost1, savedPost2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    repository = connection.getRepository(Post_1.Post);
                    problems = [{ "message": "", "attributeKey": "", "level": "" }];
                    post = new Post_1.Post();
                    post.problems = problems.slice();
                    return [4 /*yield*/, repository.save(post)];
                case 2:
                    savedPost1 = _a.sent();
                    return [4 /*yield*/, repository.save(repository.create({
                            id: savedPost1.id,
                            version: savedPost1.version,
                            problems: problems.slice()
                        }))];
                case 3:
                    savedPost2 = _a.sent();
                    savedPost1.version.should.be.equal(savedPost2.version);
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=issue-3496.js.map