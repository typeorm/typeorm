"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Cat_1 = require("./entity/Cat");
var Dog_1 = require("./entity/Dog");
describe("github issues > #620 Feature Request: Flexibility in Foreign Key names", function () {
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
    it("should work as expected", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var dog, cat, loadedCat;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dog = new Dog_1.Dog();
                    dog.DogID = "Simba";
                    return [4 /*yield*/, connection.manager.save(dog)];
                case 1:
                    _a.sent();
                    cat = new Cat_1.Cat();
                    cat.dog = dog;
                    return [4 /*yield*/, connection.manager.save(cat)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Cat_1.Cat, "cat")
                            .leftJoinAndSelect("cat.dog", "dog")
                            .getOne()];
                case 3:
                    loadedCat = _a.sent();
                    loadedCat.id.should.be.equal(1);
                    loadedCat.dog.DogID.should.be.equal("Simba");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-620.js.map