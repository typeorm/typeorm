"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #4440 simple-json column type throws error for string with no value", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly add retrieve simple-json field with no value", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var repo, post, postFound;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.id = 1;
                        post.jsonField = "";
                        return [4 /*yield*/, repo.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, repo.findOne(1)];
                    case 2:
                        postFound = _a.sent();
                        postFound.id.should.eql(1);
                        postFound.jsonField.should.eql({});
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should correctly add retrieve simple-json field with some value", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var repo, post, postFound;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.id = 1;
                        post.jsonField = { "key": "value" };
                        return [4 /*yield*/, repo.save(post)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, repo.findOne(1)];
                    case 2:
                        postFound = _a.sent();
                        postFound.id.should.eql(1);
                        postFound.jsonField.should.eql({ "key": "value" });
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-4440.js.map