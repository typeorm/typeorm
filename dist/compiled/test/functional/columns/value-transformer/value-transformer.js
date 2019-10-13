"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var PhoneBook_1 = require("./entity/PhoneBook");
var Post_1 = require("./entity/Post");
var User_1 = require("./entity/User");
var Category_1 = require("./entity/Category");
var View_1 = require("./entity/View");
var chai_1 = require("chai");
describe("columns > value-transformer functionality", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [Post_1.Post, PhoneBook_1.PhoneBook, User_1.User, Category_1.Category, View_1.View],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should marshal data using the provided value-transformer", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var postRepository, post, loadedPost, phoneBookRepository, phoneBook, loadedPhoneBook;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    postRepository = connection.getRepository(Post_1.Post);
                    post = new Post_1.Post();
                    post.title = "About columns";
                    post.tags = ["simple", "transformer"];
                    return [4 /*yield*/, postRepository.save(post)];
                case 1:
                    _a.sent();
                    // then update all its properties and save again
                    post.title = "About columns1";
                    post.tags = ["very", "simple"];
                    return [4 /*yield*/, postRepository.save(post)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, postRepository.findOne(post.id)];
                case 3:
                    loadedPost = _a.sent();
                    chai_1.expect(loadedPost.title).to.be.equal("About columns1");
                    chai_1.expect(loadedPost.tags).to.deep.eq(["very", "simple"]);
                    phoneBookRepository = connection.getRepository(PhoneBook_1.PhoneBook);
                    phoneBook = new PhoneBook_1.PhoneBook();
                    phoneBook.name = "George";
                    phoneBook.phones = new Map();
                    phoneBook.phones.set("work", 123456);
                    phoneBook.phones.set("mobile", 1234567);
                    return [4 /*yield*/, phoneBookRepository.save(phoneBook)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, phoneBookRepository.findOne(phoneBook.id)];
                case 5:
                    loadedPhoneBook = _a.sent();
                    chai_1.expect(loadedPhoneBook.name).to.be.equal("George");
                    chai_1.expect(loadedPhoneBook.phones).not.to.be.undefined;
                    chai_1.expect(loadedPhoneBook.phones.get("work")).to.equal(123456);
                    chai_1.expect(loadedPhoneBook.phones.get("mobile")).to.equal(1234567);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should apply three transformers in the right order", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var userRepository, email, user, dbUser;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(User_1.User)];
                case 1:
                    userRepository = _a.sent();
                    email = connection.name + "@JOHN.doe";
                    user = new User_1.User();
                    user.email = email;
                    return [4 /*yield*/, userRepository.save(user)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, userRepository.findOne()];
                case 3:
                    dbUser = _a.sent();
                    dbUser && dbUser.email.should.be.eql(email.toLocaleLowerCase());
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should apply all the transformers", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var categoryRepository, description, category, dbCategory;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(Category_1.Category)];
                case 1:
                    categoryRepository = _a.sent();
                    description = "  " + connection.name + "-DESCRIPTION   ";
                    category = new Category_1.Category();
                    category.description = description;
                    return [4 /*yield*/, categoryRepository.save(category)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, categoryRepository.findOne()];
                case 3:
                    dbCategory = _a.sent();
                    dbCategory && dbCategory.description.should.be.eql(description.toLocaleLowerCase().trim());
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should apply no transformer", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var viewRepository, title, view, dbView;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.getRepository(View_1.View)];
                case 1:
                    viewRepository = _a.sent();
                    title = "" + connection.name;
                    view = new View_1.View();
                    view.title = title;
                    return [4 /*yield*/, viewRepository.save(view)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, viewRepository.findOne()];
                case 3:
                    dbView = _a.sent();
                    dbView && dbView.title.should.be.eql(title);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=value-transformer.js.map