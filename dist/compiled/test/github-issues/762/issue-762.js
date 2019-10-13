"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Foo_1 = require("./entity/Foo");
var FooMetadata_1 = require("./entity/FooMetadata");
var FooChildMetadata_1 = require("./entity/FooChildMetadata");
describe("github issues > #762 Nullable @Embedded inside @Embedded", function () {
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
    it("should work perfectly with all data set", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var foo, loadedFoo;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    foo = new Foo_1.Foo();
                    foo.name = "Apple";
                    foo.metadata = new FooMetadata_1.FooMetadata();
                    foo.metadata.bar = 1;
                    foo.metadata.child = new FooChildMetadata_1.FooChildMetadata();
                    foo.metadata.child.something = 2;
                    foo.metadata.child.somethingElse = 3;
                    return [4 /*yield*/, connection.manager.save(foo)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Foo_1.Foo).findOne({ name: "Apple" })];
                case 2:
                    loadedFoo = _a.sent();
                    loadedFoo.should.be.eql({
                        id: 1,
                        name: "Apple",
                        metadata: {
                            bar: 1,
                            child: {
                                something: 2,
                                somethingElse: 3
                            }
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work perfectly with some data not set", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var foo, loadedFoo, foo2, loadedFoo2, foo3, loadedFoo3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    foo = new Foo_1.Foo();
                    foo.name = "Apple";
                    foo.metadata = new FooMetadata_1.FooMetadata();
                    foo.metadata.bar = 1;
                    foo.metadata.child = new FooChildMetadata_1.FooChildMetadata();
                    foo.metadata.child.somethingElse = 3;
                    return [4 /*yield*/, connection.manager.save(foo)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Foo_1.Foo).findOne({ name: "Apple" })];
                case 2:
                    loadedFoo = _a.sent();
                    loadedFoo.should.be.eql({
                        id: 1,
                        name: "Apple",
                        metadata: {
                            bar: 1,
                            child: {
                                something: null,
                                somethingElse: 3
                            }
                        }
                    });
                    foo2 = new Foo_1.Foo();
                    foo2.name = "Apple2";
                    foo2.metadata = new FooMetadata_1.FooMetadata();
                    foo2.metadata.child = new FooChildMetadata_1.FooChildMetadata();
                    foo2.metadata.child.something = 2;
                    return [4 /*yield*/, connection.manager.save(foo2)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Foo_1.Foo).findOne({ name: "Apple2" })];
                case 4:
                    loadedFoo2 = _a.sent();
                    loadedFoo2.should.be.eql({
                        id: 2,
                        name: "Apple2",
                        metadata: {
                            bar: null,
                            child: {
                                something: 2,
                                somethingElse: null
                            }
                        }
                    });
                    foo3 = new Foo_1.Foo();
                    foo3.name = "Apple3";
                    foo3.metadata = new FooMetadata_1.FooMetadata();
                    return [4 /*yield*/, connection.manager.save(foo3)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Foo_1.Foo).findOne({ name: "Apple3" })];
                case 6:
                    loadedFoo3 = _a.sent();
                    loadedFoo3.should.be.eql({
                        id: 3,
                        name: "Apple3",
                        metadata: {
                            bar: null,
                            child: {
                                something: null,
                                somethingElse: null
                            }
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
    it("should work perfectly without any data set", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var foo, loadedFoo;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    foo = new Foo_1.Foo();
                    foo.name = "Orange";
                    return [4 /*yield*/, connection.manager.save(foo)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.getRepository(Foo_1.Foo).findOne({ name: "Orange" })];
                case 2:
                    loadedFoo = _a.sent();
                    loadedFoo.should.be.eql({
                        id: 1,
                        name: "Orange",
                        metadata: {
                            bar: null,
                            child: {
                                something: null,
                                somethingElse: null
                            }
                        }
                    });
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-762.js.map