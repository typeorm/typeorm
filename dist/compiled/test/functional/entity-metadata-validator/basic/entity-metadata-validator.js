"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var Connection_1 = require("../../../../src/connection/Connection");
var ConnectionMetadataBuilder_1 = require("../../../../src/connection/ConnectionMetadataBuilder");
var EntityMetadataValidator_1 = require("../../../../src/metadata-builder/EntityMetadataValidator");
var chai_1 = require("chai");
describe("entity-metadata-validator", function () {
    it("should throw error if relation count decorator used with ManyToOne or OneToOne relations", function () {
        var connection = new Connection_1.Connection({
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [__dirname + "/entity/*{.js,.ts}"]
        });
        var connectionMetadataBuilder = new ConnectionMetadataBuilder_1.ConnectionMetadataBuilder(connection);
        var entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([__dirname + "/entity/*{.js,.ts}"]);
        var entityMetadataValidator = new EntityMetadataValidator_1.EntityMetadataValidator();
        chai_1.expect(function () { return entityMetadataValidator.validateMany(entityMetadatas, connection.driver); }).to.throw(Error);
    });
});
//# sourceMappingURL=entity-metadata-validator.js.map