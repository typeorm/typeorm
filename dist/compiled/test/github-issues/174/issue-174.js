"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var chai_1 = require("chai");
var Organisation_1 = require("./entity/Organisation");
var Contact_1 = require("./entity/Contact");
describe("github issues > #174 Embeded types confusing with order by", function () {
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
    it("should order organisations correctly when properties are duplicate in its embeddable", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var organisation1, organisation2, organisations;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    organisation1 = new Organisation_1.Organisation();
                    organisation1.name = "MilkyWay Co";
                    organisation1.contact = new Contact_1.Contact();
                    organisation1.contact.name = "Albert Cow";
                    organisation1.contact.email = "ceo@mlkyway.com";
                    return [4 /*yield*/, connection.manager.save(organisation1)];
                case 1:
                    _a.sent();
                    organisation2 = new Organisation_1.Organisation();
                    organisation2.name = "ChockoWay";
                    organisation2.contact = new Contact_1.Contact();
                    organisation2.contact.name = "Brendan Late";
                    organisation2.contact.email = "ceo@chockoway.com";
                    return [4 /*yield*/, connection.manager.save(organisation2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection
                            .getRepository(Organisation_1.Organisation)
                            .createQueryBuilder("organisation")
                            .orderBy("organisation.name")
                            .getMany()];
                case 3:
                    organisations = _a.sent();
                    chai_1.expect(organisations).not.to.be.undefined;
                    organisations.should.be.eql([{
                            id: 2,
                            name: "ChockoWay",
                            contact: {
                                name: "Brendan Late",
                                email: "ceo@chockoway.com"
                            }
                        }, {
                            id: 1,
                            name: "MilkyWay Co",
                            contact: {
                                name: "Albert Cow",
                                email: "ceo@mlkyway.com"
                            }
                        }]);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-174.js.map