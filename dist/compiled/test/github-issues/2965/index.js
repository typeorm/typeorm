"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var person_1 = require("./entity/person");
var note_1 = require("./entity/note");
describe("github issues > #2965 Reuse preloaded lazy relations", function () {
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
    it("should resuse preloaded lazy relations", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var repoPerson, repoNote, personA, personB, originalLoad, loadCalledCounter, res, personANotes, res, personBNotes;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    repoPerson = connection.getRepository(person_1.Person);
                    repoNote = connection.getRepository(note_1.Note);
                    return [4 /*yield*/, repoPerson.create({ name: "personA" })];
                case 1:
                    personA = _a.sent();
                    return [4 /*yield*/, repoPerson.create({ name: "personB" })];
                case 2:
                    personB = _a.sent();
                    return [4 /*yield*/, repoPerson.save([
                            personA,
                            personB,
                        ])];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, repoNote.insert({ label: "note1", owner: personA })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, repoNote.insert({ label: "note2", owner: personB })];
                case 5:
                    _a.sent();
                    originalLoad = connection.relationLoader.load;
                    loadCalledCounter = 0;
                    connection.relationLoader.load = function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        loadCalledCounter++;
                        return originalLoad.call.apply(originalLoad, tslib_1.__spread([connection.relationLoader], args));
                    };
                    return [4 /*yield*/, repoPerson.find({ relations: ["notes"] })];
                case 6:
                    res = _a.sent();
                    return [4 /*yield*/, res[0].notes];
                case 7:
                    personANotes = _a.sent();
                    loadCalledCounter.should.be.equal(0);
                    personANotes[0].label.should.be.equal("note1");
                    return [4 /*yield*/, repoPerson.find()];
                case 8:
                    res = _a.sent();
                    return [4 /*yield*/, res[1].notes];
                case 9:
                    personBNotes = _a.sent();
                    loadCalledCounter.should.be.equal(1);
                    personBNotes[0].label.should.be.equal("note2");
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=index.js.map