"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var PromiseUtils_1 = require("../../../src/util/PromiseUtils");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
var EntityNotFoundError_1 = require("../../../src/error/EntityNotFoundError");
describe("github issues > #2313 - BaseEntity has no findOneOrFail() method", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should find the appropriate record when one exists", function () { return PromiseUtils_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, result1, result2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Post_1.Post.useConnection(connection); // change connection each time because of AR specifics
                    post1 = new Post_1.Post();
                    post1.data = 123;
                    return [4 /*yield*/, post1.save()];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.data = 456;
                    return [4 /*yield*/, post2.save()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, Post_1.Post.findOneOrFail(1)];
                case 3:
                    result1 = _a.sent();
                    result1.data.should.be.eql(123);
                    return [4 /*yield*/, Post_1.Post.findOneOrFail(2)];
                case 4:
                    result2 = _a.sent();
                    result2.data.should.be.eql(456);
                    return [2 /*return*/];
            }
        });
    }); }); });
    it("should throw no matching record exists", function () { return PromiseUtils_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var e_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    Post_1.Post.useConnection(connection); // change connection each time because of AR specifics
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Post_1.Post.findOneOrFail(100)];
                case 2:
                    _a.sent();
                    chai_1.expect.fail();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _a.sent();
                    e_1.should.be.instanceOf(EntityNotFoundError_1.EntityNotFoundError);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=issue-2313.js.map