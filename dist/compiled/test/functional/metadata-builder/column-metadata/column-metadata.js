"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
var Subcounters_1 = require("./entity/Subcounters");
describe("metadata-builder > ColumnMetadata", function () {
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
    it("getValue", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, titleColumnMetadata, codeColumnMetadata, watchesColumnMetadata;
        return tslib_1.__generator(this, function (_a) {
            post = new Post_1.Post();
            post.id = 1;
            post.title = "Post #1";
            post.counters = new Counters_1.Counters();
            post.counters.code = 123;
            post.counters.likes = 2;
            post.counters.comments = 3;
            post.counters.favorites = 4;
            post.counters.subcounters = new Subcounters_1.Subcounters();
            post.counters.subcounters.version = 1;
            post.counters.subcounters.watches = 10;
            titleColumnMetadata = connection.getMetadata(Post_1.Post).columns.find(function (column) { return column.propertyName === "title"; });
            chai_1.expect(titleColumnMetadata).not.to.be.undefined;
            chai_1.expect(titleColumnMetadata.getEntityValue(post)).to.be.equal("Post #1");
            codeColumnMetadata = connection.getMetadata(Post_1.Post).columns.find(function (column) { return column.propertyName === "code"; });
            chai_1.expect(codeColumnMetadata).not.to.be.undefined;
            chai_1.expect(codeColumnMetadata.getEntityValue(post)).to.be.equal(123);
            watchesColumnMetadata = connection.getMetadata(Post_1.Post).columns.find(function (column) { return column.propertyName === "watches"; });
            chai_1.expect(watchesColumnMetadata).not.to.be.undefined;
            chai_1.expect(watchesColumnMetadata.getEntityValue(post)).to.be.equal(10);
            return [2 /*return*/];
        });
    }); })); });
    it("getValueMap", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post, titleColumnMetadata, codeColumnMetadata, watchesColumnMetadata;
        return tslib_1.__generator(this, function (_a) {
            post = new Post_1.Post();
            post.id = 1;
            post.title = "Post #1";
            post.counters = new Counters_1.Counters();
            post.counters.code = 123;
            post.counters.likes = 2;
            post.counters.comments = 3;
            post.counters.favorites = 4;
            post.counters.subcounters = new Subcounters_1.Subcounters();
            post.counters.subcounters.version = 1;
            post.counters.subcounters.watches = 10;
            titleColumnMetadata = connection.getMetadata(Post_1.Post).columns.find(function (column) { return column.propertyName === "title"; });
            chai_1.expect(titleColumnMetadata).not.to.be.undefined;
            chai_1.expect(titleColumnMetadata.getEntityValueMap(post)).to.be.eql({ title: "Post #1" });
            chai_1.expect(titleColumnMetadata.getEntityValueMap({ id: 1 })).to.be.undefined;
            codeColumnMetadata = connection.getMetadata(Post_1.Post).columns.find(function (column) { return column.propertyName === "code"; });
            chai_1.expect(codeColumnMetadata).not.to.be.undefined;
            chai_1.expect(codeColumnMetadata.getEntityValueMap(post)).to.be.eql({ counters: { code: 123 } });
            chai_1.expect(codeColumnMetadata.getEntityValueMap({ id: 1 })).to.be.undefined;
            chai_1.expect(codeColumnMetadata.getEntityValueMap({ id: 1, counters: undefined })).to.be.undefined;
            chai_1.expect(codeColumnMetadata.getEntityValueMap({ id: 1, counters: {} })).to.be.undefined;
            chai_1.expect(codeColumnMetadata.getEntityValueMap({ id: 1, counters: { code: undefined } })).to.be.undefined;
            chai_1.expect(codeColumnMetadata.getEntityValueMap({ id: 1, counters: { code: null } })).to.be.eql({ counters: { code: null } });
            chai_1.expect(codeColumnMetadata.getEntityValueMap({ id: 1, counters: { code: 0 } })).to.be.eql({ counters: { code: 0 } });
            chai_1.expect(codeColumnMetadata.getEntityValueMap({ id: 1, counters: { likes: 123 } })).to.be.undefined;
            watchesColumnMetadata = connection.getMetadata(Post_1.Post).columns.find(function (column) { return column.propertyName === "watches"; });
            chai_1.expect(watchesColumnMetadata).not.to.be.undefined;
            chai_1.expect(watchesColumnMetadata.getEntityValueMap(post)).to.be.eql({ counters: { subcounters: { watches: 10 } } });
            chai_1.expect(watchesColumnMetadata.getEntityValueMap({ id: 1 })).to.be.eql(undefined);
            chai_1.expect(watchesColumnMetadata.getEntityValueMap({ id: 1, counters: undefined })).to.be.undefined;
            chai_1.expect(watchesColumnMetadata.getEntityValueMap({ id: 1, counters: {} })).to.be.undefined;
            chai_1.expect(watchesColumnMetadata.getEntityValueMap({ id: 1, counters: { subcounters: undefined } })).to.be.undefined;
            chai_1.expect(watchesColumnMetadata.getEntityValueMap({ id: 1, counters: { subcounters: { watches: null } } })).to.be.eql({ counters: { subcounters: { watches: null } } });
            chai_1.expect(watchesColumnMetadata.getEntityValueMap({ id: 1, counters: { subcounters: { watches: 0 } } })).to.be.eql({ counters: { subcounters: { watches: 0 } } });
            chai_1.expect(watchesColumnMetadata.getEntityValueMap({ id: 1, counters: { subcounters: { version: 123 } } })).to.be.undefined;
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=column-metadata.js.map