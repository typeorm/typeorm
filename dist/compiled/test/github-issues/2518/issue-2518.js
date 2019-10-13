"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var file_entity_1 = require("./entity/file.entity");
describe("github issues > #2518 TreeRepository.findDescendantsTree does not load descendants when relationship id property exist", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"]
                    })];
                case 1: return [2 /*return*/, (connections = _a.sent())];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should load descendants when findDescendantsTree is called for a tree entity", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var repo, root, child, file;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repo = connection.getTreeRepository(file_entity_1.File);
                        return [4 /*yield*/, repo.save({ id: 1, name: "root" })];
                    case 1:
                        root = _a.sent();
                        return [4 /*yield*/, repo.save({ id: 2, name: "child", parent: root })];
                    case 2:
                        child = _a.sent();
                        chai_1.expect(child.parentId).to.be.equal(1);
                        return [4 /*yield*/, repo.createQueryBuilder("file")
                                .where("file.id = :id", { id: 1 })
                                .getOne()];
                    case 3:
                        file = _a.sent();
                        return [4 /*yield*/, repo.findDescendantsTree(file)];
                    case 4:
                        _a.sent();
                        chai_1.expect(file.children.length).to.be.greaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should load descendants when findTrees are called", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var repo, root, child, trees;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        repo = connection.getTreeRepository(file_entity_1.File);
                        return [4 /*yield*/, repo.save({ id: 1, name: "root" })];
                    case 1:
                        root = _a.sent();
                        return [4 /*yield*/, repo.save({ id: 2, name: "child", parent: root })];
                    case 2:
                        child = _a.sent();
                        chai_1.expect(child.parentId).to.be.equal(1);
                        return [4 /*yield*/, repo.findTrees()];
                    case 3:
                        trees = _a.sent();
                        chai_1.expect(trees).to.be.an("array");
                        chai_1.expect(trees[0].children.length).to.be.greaterThan(0);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
});
//# sourceMappingURL=issue-2518.js.map