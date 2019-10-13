"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Group_1 = require("./entity/Group");
describe("github issues > #1089 UUID in ClosureEntity", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: false,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly work with primary UUID column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, groupRepository, a1, a11, a12, rootGroups, a11Parent, a1Children;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, connection.synchronize()];
                case 1:
                    _a.sent();
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("group")];
                case 2:
                    table = _a.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 3:
                    _a.sent();
                    table.should.exist;
                    groupRepository = connection.getTreeRepository(Group_1.Group);
                    a1 = new Group_1.Group();
                    a1.name = "a1";
                    return [4 /*yield*/, groupRepository.save(a1)];
                case 4:
                    _a.sent();
                    a11 = new Group_1.Group();
                    a11.name = "a11";
                    a11.parent = a1;
                    return [4 /*yield*/, groupRepository.save(a11)];
                case 5:
                    _a.sent();
                    a12 = new Group_1.Group();
                    a12.name = "a12";
                    a12.parent = a1;
                    return [4 /*yield*/, groupRepository.save(a12)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, groupRepository.findRoots()];
                case 7:
                    rootGroups = _a.sent();
                    rootGroups.length.should.be.equal(1);
                    return [4 /*yield*/, groupRepository.findAncestors(a11)];
                case 8:
                    a11Parent = _a.sent();
                    a11Parent.length.should.be.equal(2);
                    return [4 /*yield*/, groupRepository.findDescendants(a1)];
                case 9:
                    a1Children = _a.sent();
                    a1Children.length.should.be.equal(3);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1089.js.map