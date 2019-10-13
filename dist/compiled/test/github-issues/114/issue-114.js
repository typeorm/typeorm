"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
var chai_1 = require("chai");
var Connection_1 = require("../../../src/connection/Connection");
describe.skip("github issues > #114 Can not be parsed correctly the URL of pg.", function () {
    var connection;
    before(function () {
        connection = new Connection_1.Connection({
            type: "postgres",
            url: "postgres://test:test@localhost:5432/test",
        });
    });
    it("should not fail in url parser", function () {
        var options = connection.options;
        chai_1.expect(options.username).to.be.eq("test");
        chai_1.expect(options.password).to.be.eq("test");
        chai_1.expect(options.host).to.be.eq("localhost");
        chai_1.expect(options.port).to.be.eq(5432);
        chai_1.expect(options.database).to.be.eq("test");
    });
});
//# sourceMappingURL=issue-114.js.map