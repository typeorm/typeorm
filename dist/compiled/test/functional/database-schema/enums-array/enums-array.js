"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../../utils/test-utils");
var EnumArrayEntity_1 = require("./entity/EnumArrayEntity");
describe("database schema > enum arrays", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["postgres"]
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create default values", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var enumEntityRepository, enumEntity, loadedEnumEntity;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    enumEntityRepository = connection.getRepository(EnumArrayEntity_1.EnumArrayEntity);
                    enumEntity = new EnumArrayEntity_1.EnumArrayEntity();
                    enumEntity.id = 1;
                    return [4 /*yield*/, enumEntityRepository.save(enumEntity)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, enumEntityRepository.findOne(1)];
                case 2:
                    loadedEnumEntity = _a.sent();
                    loadedEnumEntity.numericEnums.should.be.eql([EnumArrayEntity_1.NumericEnum.GHOST, EnumArrayEntity_1.NumericEnum.ADMIN]);
                    loadedEnumEntity.stringEnums.should.be.eql([]);
                    loadedEnumEntity.stringNumericEnums.should.be.eql([EnumArrayEntity_1.StringNumericEnum.THREE, EnumArrayEntity_1.StringNumericEnum.ONE]);
                    loadedEnumEntity.heterogeneousEnums.should.be.eql([EnumArrayEntity_1.HeterogeneousEnum.YES]);
                    loadedEnumEntity.arrayDefinedStringEnums.should.be.eql(["admin"]);
                    loadedEnumEntity.arrayDefinedNumericEnums.should.be.eql([11, 13]);
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should correctly save and retrieve", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var enumEntityRepository, enumEntity, loadedEnumEntity;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    enumEntityRepository = connection.getRepository(EnumArrayEntity_1.EnumArrayEntity);
                    enumEntity = new EnumArrayEntity_1.EnumArrayEntity();
                    enumEntity.id = 1;
                    enumEntity.numericEnums = [EnumArrayEntity_1.NumericEnum.GHOST, EnumArrayEntity_1.NumericEnum.EDITOR];
                    enumEntity.stringEnums = [EnumArrayEntity_1.StringEnum.MODERATOR];
                    enumEntity.stringNumericEnums = [EnumArrayEntity_1.StringNumericEnum.FOUR];
                    enumEntity.heterogeneousEnums = [EnumArrayEntity_1.HeterogeneousEnum.NO];
                    enumEntity.arrayDefinedStringEnums = ["editor"];
                    enumEntity.arrayDefinedNumericEnums = [12, 13];
                    return [4 /*yield*/, enumEntityRepository.save(enumEntity)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, enumEntityRepository.findOne(1)];
                case 2:
                    loadedEnumEntity = _a.sent();
                    loadedEnumEntity.numericEnums.should.be.eql([EnumArrayEntity_1.NumericEnum.GHOST, EnumArrayEntity_1.NumericEnum.EDITOR]);
                    loadedEnumEntity.stringEnums.should.be.eql([EnumArrayEntity_1.StringEnum.MODERATOR]);
                    loadedEnumEntity.stringNumericEnums.should.be.eql([EnumArrayEntity_1.StringNumericEnum.FOUR]);
                    loadedEnumEntity.heterogeneousEnums.should.be.eql([EnumArrayEntity_1.HeterogeneousEnum.NO]);
                    loadedEnumEntity.arrayDefinedStringEnums.should.be.eql(["editor"]);
                    loadedEnumEntity.arrayDefinedNumericEnums.should.be.eql([12, 13]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=enums-array.js.map