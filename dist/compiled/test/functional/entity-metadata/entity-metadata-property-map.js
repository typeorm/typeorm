"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var Counters_1 = require("./entity/Counters");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var Subcounters_1 = require("./entity/Subcounters");
var User_1 = require("./entity/User");
describe("entity-metadata > property-map", function () {
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
    it("should create correct property map object", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var user1, post1, postPropertiesMap;
        return tslib_1.__generator(this, function (_a) {
            user1 = new User_1.User();
            user1.id = 1;
            user1.name = "Alice";
            post1 = new Post_1.Post();
            post1.title = "About cars";
            post1.counters = new Counters_1.Counters();
            post1.counters.code = 1;
            post1.counters.comments = 1;
            post1.counters.favorites = 2;
            post1.counters.likes = 3;
            post1.counters.likedUsers = [user1];
            post1.counters.subcounters = new Subcounters_1.Subcounters();
            post1.counters.subcounters.version = 1;
            post1.counters.subcounters.watches = 5;
            post1.counters.subcounters.watchedUsers = [user1];
            postPropertiesMap = connection.getMetadata(Post_1.Post).propertiesMap;
            chai_1.expect(postPropertiesMap.should.be.eql({
                id: "id",
                title: "title",
                counters: {
                    code: "counters.code",
                    likes: "counters.likes",
                    comments: "counters.comments",
                    favorites: "counters.favorites",
                    subcounters: {
                        version: "counters.subcounters.version",
                        watches: "counters.subcounters.watches",
                        watchedUsers: "counters.subcounters.watchedUsers"
                    },
                    likedUsers: "counters.likedUsers"
                }
            }));
            return [2 /*return*/];
        });
    }); })); });
});
//# sourceMappingURL=entity-metadata-property-map.js.map