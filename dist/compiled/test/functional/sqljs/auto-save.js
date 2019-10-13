"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var Post_1 = require("./entity/Post");
var test_utils_1 = require("../../utils/test-utils");
describe("sqljs driver > autosave", function () {
    var connections;
    var saves = 0;
    var callback = function (database) {
        saves++;
    };
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        schemaCreate: true,
                        enabledDrivers: ["sqljs"],
                        driverSpecific: {
                            autoSaveCallback: callback,
                            autoSave: true
                        }
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    it("should call autoSaveCallback on insert, update and delete", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var posts, repository, post, savedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    posts = [
                        {
                            title: "second post"
                        },
                        {
                            title: "third post"
                        }
                    ];
                    return [4 /*yield*/, connection.createQueryBuilder().insert().into(Post_1.Post).values(posts).execute()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder().update(Post_1.Post).set({ title: "Many posts" }).execute()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.createQueryBuilder().delete().from(Post_1.Post).where("title = ?", { title: "third post" }).execute()];
                case 3:
                    _a.sent();
                    repository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "A post";
                    return [4 /*yield*/, repository.save(post)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, repository.findOne({ title: "A post" })];
                case 5:
                    savedPost = _a.sent();
                    chai_1.expect(savedPost).not.to.be.undefined;
                    if (!savedPost) return [3 /*break*/, 8];
                    savedPost.title = "A updated post";
                    return [4 /*yield*/, repository.save(savedPost)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, repository.remove(savedPost)];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8: return [4 /*yield*/, connection.close()];
                case 9:
                    _a.sent();
                    chai_1.expect(saves).to.be.equal(7);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
describe("sqljs driver > autosave off", function () {
    var connections;
    var saves = 0;
    var callback = function (database) {
        saves++;
    };
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post],
                        schemaCreate: true,
                        enabledDrivers: ["sqljs"],
                        driverSpecific: {
                            autoSaveCallback: callback,
                            autoSave: false
                        }
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    it("should not call autoSaveCallback when autoSave is disabled", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repository, post, savedPost;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "A post";
                    return [4 /*yield*/, repository.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, repository.findOne({ title: "A post" })];
                case 2:
                    savedPost = _a.sent();
                    chai_1.expect(savedPost).not.to.be.undefined;
                    if (!savedPost) return [3 /*break*/, 5];
                    savedPost.title = "A updated post";
                    return [4 /*yield*/, repository.save(savedPost)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, repository.remove(savedPost)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5: return [4 /*yield*/, connection.close()];
                case 6:
                    _a.sent();
                    chai_1.expect(saves).to.be.equal(0);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=auto-save.js.map