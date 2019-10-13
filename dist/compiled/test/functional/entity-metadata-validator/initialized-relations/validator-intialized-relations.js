"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var Connection_1 = require("../../../../src/connection/Connection");
var ConnectionMetadataBuilder_1 = require("../../../../src/connection/ConnectionMetadataBuilder");
var EntityMetadataValidator_1 = require("../../../../src/metadata-builder/EntityMetadataValidator");
var chai_1 = require("chai");
var InitializedRelationError_1 = require("../../../../src/error/InitializedRelationError");
var Category_1 = require("./entity/Category");
var Post_1 = require("./entity/Post");
var Image_1 = require("./entity/Image");
var ImageInfo_1 = require("./entity/ImageInfo");
var Question_1 = require("./entity/Question");
describe("entity-metadata-validator > initialized relations", function () {
    it("should throw error if relation with initialized array was found on many-to-many relation", function () {
        var connection = new Connection_1.Connection({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Post_1.Post, Category_1.Category]
        });
        var connectionMetadataBuilder = new ConnectionMetadataBuilder_1.ConnectionMetadataBuilder(connection);
        var entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Post_1.Post, Category_1.Category]);
        var entityMetadataValidator = new EntityMetadataValidator_1.EntityMetadataValidator();
        chai_1.expect(function () { return entityMetadataValidator.validateMany(entityMetadatas, connection.driver); }).to.throw(InitializedRelationError_1.InitializedRelationError);
    });
    it("should throw error if relation with initialized array was found on one-to-many relation", function () {
        var connection = new Connection_1.Connection({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Image_1.Image, ImageInfo_1.ImageInfo]
        });
        var connectionMetadataBuilder = new ConnectionMetadataBuilder_1.ConnectionMetadataBuilder(connection);
        var entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Image_1.Image, ImageInfo_1.ImageInfo]);
        var entityMetadataValidator = new EntityMetadataValidator_1.EntityMetadataValidator();
        chai_1.expect(function () { return entityMetadataValidator.validateMany(entityMetadatas, connection.driver); }).to.throw(InitializedRelationError_1.InitializedRelationError);
    });
    it("should not throw error if relation with initialized array was not found", function () {
        var connection = new Connection_1.Connection({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Category_1.Category]
        });
        var connectionMetadataBuilder = new ConnectionMetadataBuilder_1.ConnectionMetadataBuilder(connection);
        var entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Category_1.Category]);
        var entityMetadataValidator = new EntityMetadataValidator_1.EntityMetadataValidator();
        chai_1.expect(function () { return entityMetadataValidator.validateMany(entityMetadatas, connection.driver); }).not.to.throw(InitializedRelationError_1.InitializedRelationError);
    });
    it("should not throw error if relation with initialized array was found, but persistence for this relation was disabled", function () {
        var connection = new Connection_1.Connection({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Question_1.Question, Category_1.Category]
        });
        var connectionMetadataBuilder = new ConnectionMetadataBuilder_1.ConnectionMetadataBuilder(connection);
        var entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Question_1.Question, Category_1.Category]);
        var entityMetadataValidator = new EntityMetadataValidator_1.EntityMetadataValidator();
        chai_1.expect(function () { return entityMetadataValidator.validateMany(entityMetadatas, connection.driver); }).not.to.throw(InitializedRelationError_1.InitializedRelationError);
    });
});
//# sourceMappingURL=validator-intialized-relations.js.map