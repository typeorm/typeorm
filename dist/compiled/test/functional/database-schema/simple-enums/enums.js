"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var SimpleEnumEntity_1 = require("./entity/SimpleEnumEntity");
describe("database schema > simple-enums", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql", "mariadb", "postgres", "sqlite", "mssql"]
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly use default values", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var enumEntityRepository, enumEntity, loadedEnumEntity;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    enumEntityRepository = connection.getRepository(SimpleEnumEntity_1.SimpleEnumEntity);
                    enumEntity = new SimpleEnumEntity_1.SimpleEnumEntity();
                    enumEntity.id = 1;
                    enumEntity.enumWithoutdefault = SimpleEnumEntity_1.StringEnum.EDITOR;
                    return [4 /*yield*/, enumEntityRepository.save(enumEntity)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, enumEntityRepository.findOne(1)];
                case 2:
                    loadedEnumEntity = _a.sent();
                    loadedEnumEntity.numericEnum.should.be.eq(SimpleEnumEntity_1.NumericEnum.MODERATOR);
                    loadedEnumEntity.stringEnum.should.be.eq(SimpleEnumEntity_1.StringEnum.GHOST);
                    loadedEnumEntity.stringNumericEnum.should.be.eq(SimpleEnumEntity_1.StringNumericEnum.FOUR);
                    loadedEnumEntity.heterogeneousEnum.should.be.eq(SimpleEnumEntity_1.HeterogeneousEnum.NO);
                    loadedEnumEntity.arrayDefinedStringEnum.should.be.eq("ghost");
                    loadedEnumEntity.arrayDefinedNumericEnum.should.be.eq(12);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly save and retrieve", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var enumEntityRepository, enumEntity, loadedEnumEntity;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    enumEntityRepository = connection.getRepository(SimpleEnumEntity_1.SimpleEnumEntity);
                    enumEntity = new SimpleEnumEntity_1.SimpleEnumEntity();
                    enumEntity.id = 1;
                    enumEntity.numericEnum = SimpleEnumEntity_1.NumericEnum.EDITOR;
                    enumEntity.stringEnum = SimpleEnumEntity_1.StringEnum.ADMIN;
                    enumEntity.stringNumericEnum = SimpleEnumEntity_1.StringNumericEnum.TWO;
                    enumEntity.heterogeneousEnum = SimpleEnumEntity_1.HeterogeneousEnum.YES;
                    enumEntity.arrayDefinedStringEnum = "editor";
                    enumEntity.arrayDefinedNumericEnum = 13;
                    enumEntity.enumWithoutdefault = SimpleEnumEntity_1.StringEnum.ADMIN;
                    return [4 /*yield*/, enumEntityRepository.save(enumEntity)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, enumEntityRepository.findOne(1)];
                case 2:
                    loadedEnumEntity = _a.sent();
                    loadedEnumEntity.numericEnum.should.be.eq(SimpleEnumEntity_1.NumericEnum.EDITOR);
                    loadedEnumEntity.stringEnum.should.be.eq(SimpleEnumEntity_1.StringEnum.ADMIN);
                    loadedEnumEntity.stringNumericEnum.should.be.eq(SimpleEnumEntity_1.StringNumericEnum.TWO);
                    loadedEnumEntity.heterogeneousEnum.should.be.eq(SimpleEnumEntity_1.HeterogeneousEnum.YES);
                    loadedEnumEntity.arrayDefinedStringEnum.should.be.eq("editor");
                    loadedEnumEntity.arrayDefinedNumericEnum.should.be.eq(13);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=enums.js.map