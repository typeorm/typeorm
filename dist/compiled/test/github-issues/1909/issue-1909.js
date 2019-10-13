"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DriverUtils_1 = require("../../../src/driver/DriverUtils");
var chai_1 = require("chai");
describe("github issues > #1493 Error parsing pg connection string", function () {
    it("should parse url with empty password", function () {
        var obj = {
            username: "usern@me",
            password: "",
            host: "host",
            database: "database",
            port: 8888
        };
        var url = "postgres://" + obj.username + ":@" + obj.host + ":" + obj.port + "/" + obj.database;
        var options = DriverUtils_1.DriverUtils.buildDriverOptions({ url: url });
        chai_1.expect(options.username).to.eql(obj.username);
        chai_1.expect(options.password).to.eql(obj.password);
    });
    it("should parse url without password", function () {
        var obj = {
            username: "usern@me",
            password: "",
            host: "host",
            database: "database",
            port: 8888
        };
        var url = "postgres://" + obj.username + "@" + obj.host + ":" + obj.port + "/" + obj.database;
        var options = DriverUtils_1.DriverUtils.buildDriverOptions({ url: url });
        chai_1.expect(options.username).to.eql(obj.username);
        chai_1.expect(options.password).to.eql(obj.password);
    });
});
//# sourceMappingURL=issue-1909.js.map