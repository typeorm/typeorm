"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Post_1 = require("./entity/Post");
var IndexMetadata_1 = require("../../../src/metadata/IndexMetadata");
var chai_1 = require("chai");
describe("github issues > #750 Need option for Mysql's full text search", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"],
                        schemaCreate: true,
                        dropSchema: true,
                    })];
                case 1:
                    connections = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should correctly create SPATIAL and FULLTEXT indices", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var queryRunner, table, spatialIndex, fulltextIndex, metadata, polygonColumn, indexMetadata, fulltextIndexMetadata, spatialIndices, fulltextIndex2;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryRunner = connection.createQueryRunner();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 1:
                    table = _a.sent();
                    table.indices.length.should.be.equal(2);
                    spatialIndex = table.indices.find(function (index) { return !!index.isSpatial; });
                    spatialIndex.should.be.exist;
                    fulltextIndex = table.indices.find(function (index) { return !!index.isFulltext; });
                    fulltextIndex.should.be.exist;
                    metadata = connection.getMetadata(Post_1.Post);
                    polygonColumn = metadata.findColumnWithPropertyName("polygon");
                    indexMetadata = new IndexMetadata_1.IndexMetadata({
                        entityMetadata: metadata,
                        columns: [polygonColumn],
                        args: {
                            target: Post_1.Post,
                            spatial: true
                        }
                    });
                    indexMetadata.build(connection.namingStrategy);
                    metadata.indices.push(indexMetadata);
                    fulltextIndexMetadata = metadata.indices.find(function (index) { return index.isFulltext; });
                    fulltextIndexMetadata.isFulltext = false;
                    return [4 /*yield*/, connection.synchronize()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, queryRunner.getTable("post")];
                case 3:
                    table = _a.sent();
                    table.indices.length.should.be.equal(3);
                    spatialIndices = table.indices.filter(function (index) { return !!index.isSpatial; });
                    spatialIndices.length.should.be.equal(2);
                    fulltextIndex2 = table.indices.find(function (index) { return !!index.isFulltext; });
                    chai_1.expect(fulltextIndex2).to.be.undefined;
                    return [4 /*yield*/, queryRunner.release()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-750.js.map