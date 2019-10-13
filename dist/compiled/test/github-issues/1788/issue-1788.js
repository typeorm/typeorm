"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Provider_1 = require("./entity/Provider");
var Personalization_1 = require("./entity/Personalization");
var chai_1 = require("chai");
describe("github issues > #1788 One to One does not load relationships.", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, (connections = _a.sent())];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should work as expected when using find* methods with relations explicitly provided", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var personalizationRepository, providerRepository, personalization, provider, dbProvider;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    personalizationRepository = connection.getRepository(Personalization_1.Personalization);
                    providerRepository = connection.getRepository(Provider_1.Provider);
                    personalization = personalizationRepository.create({
                        logo: "https://typeorm.io/logo.png"
                    });
                    return [4 /*yield*/, personalizationRepository.save(personalization)];
                case 1:
                    _a.sent();
                    provider = providerRepository.create({
                        name: "Provider",
                        description: "Desc",
                        personalization: personalization
                    });
                    return [4 /*yield*/, providerRepository.save(provider)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, providerRepository.find({
                            relations: ["personalization"]
                        })];
                case 3:
                    dbProvider = _a.sent();
                    chai_1.expect(dbProvider[0].personalization).to.not.eql(undefined);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1788.js.map