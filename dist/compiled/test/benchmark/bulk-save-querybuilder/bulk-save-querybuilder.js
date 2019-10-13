"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Document_1 = require("../bulk-save-case2/entity/Document");
describe("benchmark > bulk-save > case-querybuilder", function () {
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
                        document.date = new Date();
                        documents.push(document);
                    }
                    return [4 /*yield*/, connection.createQueryRunner().query("CREATE TABLE \"document\" (\"id\" text NOT NULL, \"docId\" text NOT NULL, \"label\" text NOT NULL, \"context\" text NOT NULL, \"date\" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT \"PK_e57d3357f83f3cdc0acffc3d777\" PRIMARY KEY (\"id\"))")];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.createQueryBuilder()
                            .insert()
                            .into("document", [
                            "id",
                            "docId",
                            "label",
                            "context",
                            "date",
                        ])
                            .values(documents)
                            .execute()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=bulk-save-querybuilder.js.map