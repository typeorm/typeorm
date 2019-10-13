"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var test_utils_1 = require("../../utils/test-utils");
var Document_1 = require("./entity/Document");
var chai_1 = require("chai");
describe("github issues > #85 - Column option insert: false, update: false", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should ignore value of non-inserted column", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var doc1, docs, doc2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    doc1 = new Document_1.Document();
                    doc1.id = 1;
                    doc1.version = 42;
                    return [4 /*yield*/, connection.manager.save(doc1)];
                case 1:
                    _a.sent();
                    docs = connection.getRepository(Document_1.Document);
                    return [4 /*yield*/, docs.findOne()];
                case 2:
                    doc2 = _a.sent();
                    chai_1.expect(doc2.version).to.be.equal(1);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should be able to create an entity with column entirely missing", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, doc1, docs, _a, doc2;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.dropColumn("document", "permission")];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 2:
                    _b.sent();
                    doc1 = new Document_1.Document();
                    doc1.id = 1;
                    return [4 /*yield*/, connection.manager.save(doc1)];
                case 3:
                    _b.sent();
                    docs = connection.getRepository(Document_1.Document);
                    // We got here without throwing an error, which is good news.
                    _a = chai_1.expect;
                    return [4 /*yield*/, docs.count()];
                case 4:
                    // We got here without throwing an error, which is good news.
                    _a.apply(void 0, [_b.sent()]).to.eql(1);
                    // And just to confirm that the above test is meaningful, we drop a regular column
                    // and see that creating an entity does throw an error.
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.dropColumn("document", "name")];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, queryRunner.release()];
                case 6:
                    _b.sent();
                    doc2 = new Document_1.Document();
                    doc2.id = 2;
                    return [2 /*return*/, connection.manager.save(doc2).should.be.rejected];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-85.js.map