"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Simple_1 = require("./entity/Simple");
var Complex_1 = require("./entity/Complex");
describe("github issues > #2103 query builder regression", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("whereInIds should respect logical operator precedence > single simple primary key (in is used)", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repository, savedEntities, ids, entities;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repository = connection.getRepository(Simple_1.Simple);
                    return [4 /*yield*/, repository.save([
                            repository.create({ x: 1 }),
                            repository.create({ x: 2 }),
                            repository.create({ x: 1 }),
                            repository.create({ x: 3 })
                        ])];
                case 1:
                    savedEntities = _a.sent();
                    savedEntities.length.should.be.equal(4); // check if they all are saved
                    ids = savedEntities.map(function (entity) { return entity.id; });
                    return [4 /*yield*/, repository.createQueryBuilder("s")
                            .whereInIds(ids)
                            .andWhere("x = 1")
                            .getMany()];
                case 2:
                    entities = _a.sent();
                    entities.map(function (entity) { return entity.id; }).should.be.eql(savedEntities
                        .filter(function (entity) { return entity.x === 1; })
                        .map(function (entity) { return entity.id; }));
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("whereInIds should respect logical operator precedence > multiple primary keys", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repository, savedEntities, ids, entities;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repository = connection.getRepository(Complex_1.Complex);
                    return [4 /*yield*/, repository.save([
                            repository.create({ id: 1, code: 1, x: 1 }),
                            repository.create({ id: 2, code: 1, x: 2 }),
                            repository.create({ id: 3, code: 1, x: 1 }),
                            repository.create({ id: 4, code: 1, x: 3 })
                        ])];
                case 1:
                    savedEntities = _a.sent();
                    savedEntities.length.should.be.equal(4); // check if they all are saved
                    ids = savedEntities.map(function (entity) { return entity.id; });
                    return [4 /*yield*/, repository.createQueryBuilder("s")
                            .whereInIds(ids.map(function (id) {
                            return { id: id, code: 1 };
                        }))
                            .andWhere("x = 1")
                            .getMany()];
                case 2:
                    entities = _a.sent();
                    entities.map(function (entity) { return entity.id; }).should.be.eql(savedEntities
                        .filter(function (entity) { return entity.x === 1; })
                        .map(function (entity) { return entity.id; }));
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-2103.js.map