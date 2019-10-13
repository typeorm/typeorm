"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Artikel_1 = require("./entity/Artikel");
var Kollektion_1 = require("./entity/Kollektion");
describe("github issues > #71 ManyToOne relation with custom column name persistence fails", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should persist successfully entity successfully with its many-to-one relation", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var kollektion, artikel, loadedArtikel;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    kollektion = new Kollektion_1.Kollektion();
                    kollektion.name = "kollektion #1";
                    artikel = new Artikel_1.Artikel();
                    artikel.name = "artikel #1";
                    artikel.nummer = "1";
                    artikel.extrabarcode = "123456789";
                    artikel.saison = "------";
                    artikel.kollektion = kollektion;
                    return [4 /*yield*/, connection.manager.save(artikel)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Artikel_1.Artikel, "artikel")
                            .innerJoinAndSelect("artikel.kollektion", "kollektion")
                            .where("artikel.id=:id", { id: 1 })
                            .getOne()];
                case 2:
                    loadedArtikel = _a.sent();
                    chai_1.expect(kollektion).not.to.be.undefined;
                    chai_1.expect(loadedArtikel).not.to.be.undefined;
                    loadedArtikel.should.be.eql({
                        id: 1,
                        nummer: "1",
                        name: "artikel #1",
                        extrabarcode: "123456789",
                        saison: "------",
                        kollektion: {
                            id: 1,
                            name: "kollektion #1"
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-71.js.map