"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Book_1 = require("./entity/Book");
describe("github issues > #3551 array of embedded documents through multiple levels are not handled", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mongodb"],
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should return entity with all these embedded documents", function () { return src_1.PromiseUtils.runInSequence(connections, function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var bookInput, books, book;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    bookInput = {
                        title: "Book 1",
                        chapters: [
                            {
                                title: "Chapter 1",
                                pages: [
                                    {
                                        number: 1
                                    },
                                    {
                                        number: 2
                                    }
                                ]
                            },
                            {
                                title: "Chapter 2",
                                pages: [
                                    {
                                        number: 3
                                    },
                                    {
                                        number: 4
                                    }
                                ]
                            }
                        ]
                    };
                    return [4 /*yield*/, connection.mongoManager.getMongoRepository(Book_1.Book).insert(bookInput)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.mongoManager.getMongoRepository(Book_1.Book).find()];
                case 2:
                    books = _a.sent();
                    book = books[0];
                    book.title.should.be.equal(bookInput.title);
                    book.chapters.should.be.lengthOf(2);
                    book.chapters[0].title.should.be.equal(bookInput.chapters[0].title);
                    book.chapters[0].pages.should.have.lengthOf(2);
                    book.chapters[0].pages[0].number.should.be.equal(bookInput.chapters[0].pages[0].number);
                    book.chapters[0].pages[1].number.should.be.equal(bookInput.chapters[0].pages[1].number);
                    book.chapters[1].pages.should.have.lengthOf(2);
                    book.chapters[1].pages[0].number.should.be.equal(bookInput.chapters[1].pages[0].number);
                    book.chapters[1].pages[1].number.should.be.equal(bookInput.chapters[1].pages[1].number);
                    return [2 /*return*/];
            }
        });
    }); }); });
});
//# sourceMappingURL=issue-3551.js.map