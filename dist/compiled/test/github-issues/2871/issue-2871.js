"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var src_1 = require("../../../src");
var Bar_1 = require("./entity/Bar");
var documentEnum_1 = require("./documentEnum");
describe("github issues > #2871 Empty enum array is returned as array with single empty string", function () {
    var connection;
    var repository;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var options;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = test_utils_1.setupSingleTestingConnection("postgres", {
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    });
                    if (!options)
                        return [2 /*return*/];
                    return [4 /*yield*/, src_1.createConnection(options)];
                case 1:
                    connection = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!connection)
                        return [2 /*return*/];
                    return [4 /*yield*/, test_utils_1.reloadTestingDatabases([connection])];
                case 1:
                    _a.sent();
                    repository = connection.getRepository(Bar_1.Bar);
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections([connection]); });
    it("should extract array with values from enum array values from 'postgres'", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var documents, barSaved, barFromDb;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!connection)
                        return [2 /*return*/];
                    documents = [documentEnum_1.DocumentEnum.DOCUMENT_A, documentEnum_1.DocumentEnum.DOCUMENT_B, documentEnum_1.DocumentEnum.DOCUMENT_C];
                    return [4 /*yield*/, repository.save({ documents: documents })];
                case 1:
                    barSaved = _a.sent();
                    return [4 /*yield*/, repository.findOne(barSaved.barId)];
                case 2:
                    barFromDb = _a.sent();
                    chai_1.expect(barFromDb.documents).to.eql(documents);
                    return [2 /*return*/];
            }
        });
    }); });
    it("should extract array with one value from enum array with one value from 'postgres'", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var documents, barSaved, barFromDb;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!connection)
                        return [2 /*return*/];
                    documents = [documentEnum_1.DocumentEnum.DOCUMENT_D];
                    return [4 /*yield*/, repository.save({ documents: documents })];
                case 1:
                    barSaved = _a.sent();
                    return [4 /*yield*/, repository.findOne(barSaved.barId)];
                case 2:
                    barFromDb = _a.sent();
                    chai_1.expect(barFromDb.documents).to.eql(documents);
                    return [2 /*return*/];
            }
        });
    }); });
    // This `it` test that issue #2871 is fixed
    it("should extract empty array from empty enum array from 'postgres'", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var documents, barSaved, barFromDb;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!connection)
                        return [2 /*return*/];
                    documents = [];
                    return [4 /*yield*/, repository.save({ documents: documents })];
                case 1:
                    barSaved = _a.sent();
                    return [4 /*yield*/, repository.findOne(barSaved.barId)];
                case 2:
                    barFromDb = _a.sent();
                    chai_1.expect(barFromDb.documents).to.eql(documents);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=issue-2871.js.map