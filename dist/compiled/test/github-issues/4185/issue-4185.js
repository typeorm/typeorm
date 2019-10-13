"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var chai_1 = require("chai");
describe("github issues > #4185 afterLoad() subscriber interface missing additional info available on other events", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should invoke afterLoad() with LoadEvent", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var e_1, _a, post1, post2, entities, entities_1, entities_1_1, entity, event;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    post1 = new Post_1.Post();
                    post1.id = 1;
                    post2 = new Post_1.Post();
                    post2.id = 2;
                    return [4 /*yield*/, connection.manager.save([post1, post2])];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, connection.manager
                            .getRepository(Post_1.Post)
                            .find()];
                case 2:
                    entities = _b.sent();
                    chai_1.assert.strictEqual(entities.length, 2);
                    try {
                        for (entities_1 = tslib_1.__values(entities), entities_1_1 = entities_1.next(); !entities_1_1.done; entities_1_1 = entities_1.next()) {
                            entity = entities_1_1.value;
                            chai_1.assert.isDefined(entity.simpleSubscriberSaw);
                            event = entity.extendedSubscriberSaw;
                            chai_1.assert.isDefined(event);
                            chai_1.assert.strictEqual(event.connection, connection);
                            chai_1.assert.isDefined(event.queryRunner);
                            chai_1.assert.isDefined(event.manager);
                            chai_1.assert.strictEqual(event.entity, entity);
                            chai_1.assert.isDefined(event.metadata);
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (entities_1_1 && !entities_1_1.done && (_a = entities_1.return)) _a.call(entities_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-4185.js.map