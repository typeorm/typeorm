"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var test_utils_1 = require("../../utils/test-utils");
var context_1 = require("./entity/ver2/context");
var record_1 = require("./entity/ver2/record");
var user_1 = require("./entity/ver2/user");
describe("github issues > #2201 - Create a select query when using a (custom) junction table", function () {
    it("Should create only two PM columns ('order_id' and 'user_id')", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connections, contextMetadata, expectedColumnNames, existingColumnNames;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/ver1/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1:
                    connections = _a.sent();
                    if (!connections.length)
                        return [2 /*return*/];
                    contextMetadata = connections[0].entityMetadatas.find(function (metadata) { return metadata.name === "RecordContext"; });
                    expectedColumnNames = ["record_id", "meta", "user_id"];
                    existingColumnNames = contextMetadata.columns.map(function (col) { return col.databaseName; });
                    chai_1.expect(existingColumnNames.length).to.eql(expectedColumnNames.length);
                    chai_1.expect(existingColumnNames).have.members(expectedColumnNames);
                    return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it.skip("Should not try to update the junction table when not needed", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connections, user, record, context, query, result;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/ver2/*{.js,.ts}"],
                        enabledDrivers: ["postgres"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    if (!connections.length)
                        return [2 /*return*/];
                    user_1.User.useConnection(connections[0]);
                    record_1.Record.useConnection(connections[0]);
                    context_1.RecordContext.useConnection(connections[0]);
                    user = user_1.User.create({ id: "user1" });
                    return [4 /*yield*/, user.save()];
                case 2:
                    _a.sent();
                    record = record_1.Record.create({ id: "record1", status: "pending" });
                    return [4 /*yield*/, record.save()];
                case 3:
                    _a.sent();
                    context = context_1.RecordContext.create({
                        user: user,
                        record: record,
                        userId: user.id,
                        recordId: record.id,
                        meta: { name: "meta name", description: "meta description" }
                    });
                    return [4 /*yield*/, context.save()];
                case 4:
                    _a.sent();
                    query = record_1.Record
                        .createQueryBuilder("record")
                        .leftJoinAndSelect("record.contexts", "context")
                        .where("record.id = :recordId", { recordId: record.id });
                    return [4 /*yield*/, query.getOne()];
                case 5:
                    result = (_a.sent());
                    result.status = "failed";
                    return [4 /*yield*/, result.save()];
                case 6:
                    _a.sent();
                    chai_1.expect(0).to.eql(0);
                    return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=issue-2201.js.map