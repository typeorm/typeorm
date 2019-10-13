"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("github issues > #2287 - QueryBuilder IN and ANY Fail with .where - Postgres", function () {
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
    it("should allow to explicitly insert primary key value", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var post1, post2, result1, result2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.skill_id_array = [1, 2];
                    return [4 /*yield*/, connection.manager.save(post1)];
                case 1:
                    _a.sent();
                    post2 = new Post_1.Post();
                    post2.skill_id_array = [2];
                    return [4 /*yield*/, connection.manager.save(post2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .getRepository(Post_1.Post)
                            .createQueryBuilder("post") // you shall assign an alias
                            .where(":id = ANY(post.skill_id_array)", { id: 1 }) // and use that alias everywhere in your query builder
                            .getMany()];
                case 3:
                    result1 = _a.sent();
                    result1.should.be.eql([
                        { id: 1, skill_id_array: [1, 2] },
                    ]);
                    return [4 /*yield*/, connection
                            .getRepository(Post_1.Post)
                            .createQueryBuilder("post") // you shall assign an alias
                            .where(":id = ANY(post.skill_id_array)", { id: 2 }) // and use that alias everywhere in your query builder
                            .getMany()];
                case 4:
                    result2 = _a.sent();
                    result2.should.be.eql([
                        { id: 1, skill_id_array: [1, 2] },
                        { id: 2, skill_id_array: [2] },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2287.js.map