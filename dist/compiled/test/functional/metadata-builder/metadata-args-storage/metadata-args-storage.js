"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var Post_1 = require("./entity/Post");
var ContentModule_1 = require("./entity/ContentModule");
var Unit_1 = require("./entity/Unit");
var MetadataUtils_1 = require("../../../../src/metadata-builder/MetadataUtils");
describe("metadata builder > MetadataArgsUtils", function () {
    it("getInheritanceTree", function () {
        var inheritanceTree = MetadataUtils_1.MetadataUtils.getInheritanceTree(Post_1.Post);
        inheritanceTree.should.be.eql([
            Post_1.Post,
            ContentModule_1.ContentModule,
            Unit_1.Unit,
        ]);
    });
    it("filterByTargetClasses", function () {
        MetadataUtils_1.MetadataUtils.filterByTarget([
            {},
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: Post_1.Post },
            { target: ContentModule_1.ContentModule },
            { target: Unit_1.Unit },
        ], [Post_1.Post, Unit_1.Unit]).should.be.eql([
            { target: Post_1.Post },
            { target: Unit_1.Unit },
        ]);
        MetadataUtils_1.MetadataUtils.filterByTarget([
            {},
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule_1.ContentModule },
            { target: Unit_1.Unit },
        ], [Post_1.Post, Unit_1.Unit]).should.be.eql([
            { target: Unit_1.Unit },
        ]);
        MetadataUtils_1.MetadataUtils.filterByTarget([
            {},
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule_1.ContentModule },
            { target: Post_1.Post },
            { target: Unit_1.Unit },
        ], [Post_1.Post, Unit_1.Unit, ContentModule_1.ContentModule]).should.be.eql([
            { target: ContentModule_1.ContentModule },
            { target: Post_1.Post },
            { target: Unit_1.Unit },
        ]);
        MetadataUtils_1.MetadataUtils.filterByTarget([], [Post_1.Post, Unit_1.Unit, ContentModule_1.ContentModule]).should.be.eql([]);
        MetadataUtils_1.MetadataUtils.filterByTarget([
            {},
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule_1.ContentModule },
            { target: Post_1.Post },
            { target: Unit_1.Unit },
        ]).should.be.eql([
            {},
            { target: undefined },
            { target: null },
            { target: 1 },
            { target: "" },
            { target: ContentModule_1.ContentModule },
            { target: Post_1.Post },
            { target: Unit_1.Unit },
        ]);
    });
});
//# sourceMappingURL=metadata-args-storage.js.map