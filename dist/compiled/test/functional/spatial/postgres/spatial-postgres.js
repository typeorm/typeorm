"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var chai_1 = require("chai");
var test_utils_1 = require("../../../utils/test-utils");
var Post_1 = require("./entity/Post");
describe("spatial-postgres", function () {
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
    beforeEach(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var err_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, test_utils_1.reloadTestingDatabases(connections)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    console.warn(err_1.stack);
                    throw err_1;
                case 3: return [2 /*return*/];
            }
        });
    }); });
    after(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var err_2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, test_utils_1.closeTestingConnections(connections)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.warn(err_2.stack);
                    throw err_2;
                case 3: return [2 /*return*/];
            }
        });
    }); });
    it("should create correct schema with Postgres' geometry type", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, schema, pointColumn;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("post")];
                    case 1:
                        schema = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        chai_1.expect(schema).not.to.be.undefined;
                        pointColumn = schema.columns.find(function (tableColumn) {
                            return tableColumn.name === "point" && tableColumn.type === "geometry";
                        });
                        chai_1.expect(pointColumn).to.not.be.undefined;
                        chai_1.expect(pointColumn.spatialFeatureType.toLowerCase()).to.equal("point");
                        chai_1.expect(pointColumn.srid).to.equal(4326);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should create correct schema with Postgres' geography type", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, schema;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("post")];
                    case 1:
                        schema = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        chai_1.expect(schema).not.to.be.undefined;
                        chai_1.expect(schema.columns.find(function (tableColumn) {
                            return tableColumn.name === "geog" && tableColumn.type === "geography";
                        })).to.not.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should create correct schema with Postgres' geometry indices", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var queryRunner, schema;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        queryRunner = connection.createQueryRunner();
                        return [4 /*yield*/, queryRunner.getTable("post")];
                    case 1:
                        schema = _a.sent();
                        return [4 /*yield*/, queryRunner.release()];
                    case 2:
                        _a.sent();
                        chai_1.expect(schema).not.to.be.undefined;
                        chai_1.expect(schema.indices.find(function (tableIndex) {
                            return tableIndex.isSpatial === true &&
                                tableIndex.columnNames.length === 1 &&
                                tableIndex.columnNames[0] === "geom";
                        })).to.not.be.undefined;
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should persist geometry correctly", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var geom, recordRepo, post, persistedPost, foundPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        geom = {
                            type: "Point",
                            coordinates: [0, 0]
                        };
                        recordRepo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.geom = geom;
                        return [4 /*yield*/, recordRepo.save(post)];
                    case 1:
                        persistedPost = _a.sent();
                        return [4 /*yield*/, recordRepo.findOne(persistedPost.id)];
                    case 2:
                        foundPost = _a.sent();
                        chai_1.expect(foundPost).to.exist;
                        chai_1.expect(foundPost.geom).to.deep.equal(geom);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should persist geography correctly", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var geom, recordRepo, post, persistedPost, foundPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        geom = {
                            type: "Point",
                            coordinates: [0, 0]
                        };
                        recordRepo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.geog = geom;
                        return [4 /*yield*/, recordRepo.save(post)];
                    case 1:
                        persistedPost = _a.sent();
                        return [4 /*yield*/, recordRepo.findOne(persistedPost.id)];
                    case 2:
                        foundPost = _a.sent();
                        chai_1.expect(foundPost).to.exist;
                        chai_1.expect(foundPost.geog).to.deep.equal(geom);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should update geometry correctly", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var geom, geom2, recordRepo, post, persistedPost, foundPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        geom = {
                            type: "Point",
                            coordinates: [0, 0]
                        };
                        geom2 = {
                            type: "Point",
                            coordinates: [45, 45]
                        };
                        recordRepo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.geom = geom;
                        return [4 /*yield*/, recordRepo.save(post)];
                    case 1:
                        persistedPost = _a.sent();
                        return [4 /*yield*/, recordRepo.update({
                                id: persistedPost.id
                            }, {
                                geom: geom2
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, recordRepo.findOne(persistedPost.id)];
                    case 3:
                        foundPost = _a.sent();
                        chai_1.expect(foundPost).to.exist;
                        chai_1.expect(foundPost.geom).to.deep.equal(geom2);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should re-save geometry correctly", function () {
        return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var geom, geom2, recordRepo, post, persistedPost, foundPost;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        geom = {
                            type: "Point",
                            coordinates: [0, 0]
                        };
                        geom2 = {
                            type: "Point",
                            coordinates: [45, 45]
                        };
                        recordRepo = connection.getRepository(Post_1.Post);
                        post = new Post_1.Post();
                        post.geom = geom;
                        return [4 /*yield*/, recordRepo.save(post)];
                    case 1:
                        persistedPost = _a.sent();
                        persistedPost.geom = geom2;
                        return [4 /*yield*/, recordRepo.save(persistedPost)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, recordRepo.findOne(persistedPost.id)];
                    case 3:
                        foundPost = _a.sent();
                        chai_1.expect(foundPost).to.exist;
                        chai_1.expect(foundPost.geom).to.deep.equal(geom2);
                        return [2 /*return*/];
                }
            });
        }); }));
    });
    it("should be able to order geometries by distance", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var geoJson1, geoJson2, origin, post1, post2, posts1, posts2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    geoJson1 = {
                        type: "Point",
                        coordinates: [
                            139.9341032213472,
                            36.80798008559315
                        ]
                    };
                    geoJson2 = {
                        type: "Point",
                        coordinates: [
                            139.933053,
                            36.805711
                        ]
                    };
                    origin = {
                        type: "Point",
                        coordinates: [
                            139.933227,
                            36.808005
                        ]
                    };
                    post1 = new Post_1.Post();
                    post1.geom = geoJson1;
                    post2 = new Post_1.Post();
                    post2.geom = geoJson2;
                    return [4 /*yield*/, connection.manager.save([post1, post2])];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .where("ST_Distance(post.geom, ST_GeomFromGeoJSON(:origin)) > 0")
                            .orderBy({
                            "ST_Distance(post.geom, ST_GeomFromGeoJSON(:origin))": {
                                order: "ASC",
                                nulls: "NULLS FIRST"
                            }
                        })
                            .setParameters({ origin: JSON.stringify(origin) })
                            .getMany()];
                case 2:
                    posts1 = _a.sent();
                    return [4 /*yield*/, connection.manager
                            .createQueryBuilder(Post_1.Post, "post")
                            .orderBy("ST_Distance(post.geom, ST_GeomFromGeoJSON(:origin))", "DESC")
                            .setParameters({ origin: JSON.stringify(origin) })
                            .getMany()];
                case 3:
                    posts2 = _a.sent();
                    chai_1.expect(posts1[0].id).to.be.equal(post1.id);
                    chai_1.expect(posts2[0].id).to.be.equal(post2.id);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=spatial-postgres.js.map