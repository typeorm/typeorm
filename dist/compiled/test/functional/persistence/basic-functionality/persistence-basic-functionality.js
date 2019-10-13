"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Category_1 = require("./entity/Category");
var User_1 = require("./entity/User");
describe("persistence > basic functionality", function () {
    var _this = this;
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should save an entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.save(new Post_1.Post(1, "Hello Post"))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should remove an entity", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    return [4 /*yield*/, connection.manager.save(post)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove(post)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw an error when not an object is passed to a save method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.save(undefined).should.be.rejectedWith("Cannot save, given value must be an entity, instead \"undefined\" is given.")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(null).should.be.rejectedWith("Cannot save, given value must be an entity, instead \"null\" is given.")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save(123).should.be.rejectedWith("Cannot save, given value must be an entity, instead \"123\" is given.")];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw an error when not an object is passed to a remove method", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.remove(undefined).should.be.rejectedWith("Cannot remove, given value must be an entity, instead \"undefined\" is given.")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove(null).should.be.rejectedWith("Cannot remove, given value must be an entity, instead \"null\" is given.")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove(123).should.be.rejectedWith("Cannot remove, given value must be an entity, instead \"123\" is given.")];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should throw an exception if object literal is given instead of constructed entity because it cannot determine what to save", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.manager.save({}).should.be.rejectedWith("Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save([{}, {}]).should.be.rejectedWith("Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.")];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.save([new Post_1.Post(1, "Hello Post"), {}]).should.be.rejectedWith("Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.")];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove({}).should.be.rejectedWith("Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.")];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove([{}, {}]).should.be.rejectedWith("Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.")];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove([new Post_1.Post(1, "Hello Post"), {}]).should.be.rejectedWith("Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.")];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to save and remove entities of different types", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, category, user;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post = new Post_1.Post(1, "Hello Post");
                    category = new Category_1.Category(1, "Hello Category");
                    user = new User_1.User(1, "Hello User");
                    return [4 /*yield*/, connection.manager.save([post, category, user])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1).should.eventually.eql({ id: 1, title: "Hello Post" })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1).should.eventually.eql({ id: 1, name: "Hello Category" })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(User_1.User, 1).should.eventually.eql({ id: 1, name: "Hello User" })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.remove([post, category, user])];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Post_1.Post, 1).should.eventually.be.undefined];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Category_1.Category, 1).should.eventually.be.undefined];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(User_1.User, 1).should.eventually.be.undefined];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=persistence-basic-functionality.js.map