"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var Author_1 = require("./entity/Author");
var Photo_1 = require("./entity/Photo");
var PhotoMetadata_1 = require("./entity/PhotoMetadata");
var chai_1 = require("chai");
describe("github issue > #1416 Wrong behavior when fetching an entity that has a relation with its own eager relations", function () {
    var connections = [];
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should load eager relations of an entity's relations recursively", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var metadata, photo, photoAuthor, author;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metadata = new PhotoMetadata_1.PhotoMetadata();
                    metadata.height = 640;
                    metadata.width = 480;
                    metadata.compressed = true;
                    metadata.comment = "cybershoot";
                    metadata.orientation = "portait";
                    return [4 /*yield*/, connection.manager.save(metadata)];
                case 1:
                    _a.sent();
                    photo = new Photo_1.Photo();
                    photo.name = "Me and Bears";
                    photo.description = "I am near polar bears";
                    photo.filename = "photo-with-bears.jpg";
                    photo.isPublished = true;
                    photo.metadata = metadata;
                    return [4 /*yield*/, connection.manager.save(photo)];
                case 2:
                    _a.sent();
                    photoAuthor = new Author_1.Author();
                    photoAuthor.name = "John Doe";
                    photoAuthor.photos = [photo];
                    return [4 /*yield*/, connection.manager.save(photoAuthor)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, connection.manager.findOne(Author_1.Author, {
                            where: {
                                name: photoAuthor.name
                            },
                            relations: ["photos"]
                        })];
                case 4:
                    author = _a.sent();
                    chai_1.expect(author).not.to.be.undefined;
                    chai_1.expect(author.photos[0]).not.to.be.undefined;
                    chai_1.expect(author.photos[0]).to.eql(photo);
                    chai_1.expect(author.photos[0].metadata).not.to.be.undefined;
                    chai_1.expect(author.photos[0].metadata).to.eql(metadata);
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1416.js.map