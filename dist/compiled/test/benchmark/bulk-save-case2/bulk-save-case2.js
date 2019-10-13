"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Document_1 = require("./entity/Document");
describe("benchmark > bulk-save > case2", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () { return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({ __dirname: __dirname, enabledDrivers: ["postgres"] })];
            case 1: return [2 /*return*/, connections = _a.sent()];
        }
    }); }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("testing bulk save of 10000 objects", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var documents, i, document;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    documents = [];
                    for (i = 0; i < 10000; i++) {
                        document = new Document_1.Document();
                        document.id = i.toString();
                        document.docId = "label/" + i;
                        document.context = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent vel faucibus nunc. Etiam volutpat vel urna in scelerisque. Cras a erat ipsum. ";
                        document.label = "label/" + i;
                        document.distributions = [
                            {
                                weight: "0.9",
                                id: i,
                                docId: i
                            },
                            {
                                weight: "0.23123",
                                id: i,
                                docId: i
                            },
                            {
                                weight: "0.12312",
                                id: i,
                                docId: i
                            }
                        ];
                        document.date = new Date();
                        documents.push(document);
                        // await connection.manager.save(document);
                        // await connection.manager.insert(Document, document);
                    }
                    return [4 /*yield*/, connection.manager.save(documents)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=bulk-save-case2.js.map