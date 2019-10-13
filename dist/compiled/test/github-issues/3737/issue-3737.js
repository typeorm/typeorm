"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DriverUtils_1 = require("../../../src/driver/DriverUtils");
var chai_1 = require("chai");
describe("github issues > #3737 Should URL-decode the user info of a data source URI", function () {
    it("should parse URL with percent-encoded username", function () {
        var obj = {
            username: "user.name@domain.com",
            password: "password",
            host: "host",
            database: "database",
            port: 8888
        };
        var url = "postgres://" + encodeURIComponent(obj.username) + ":" + obj.password + "@" + obj.host + ":" + obj.port + "/" + obj.database;
        var options = DriverUtils_1.DriverUtils.buildDriverOptions({ url: url });
        chai_1.expect(options.username).to.eql(obj.username);
    });
    it("should parse URL with percent-encoded password", function () {
        var obj = {
            username: "user",
            password: "pass #w@rd ?",
            host: "host",
            database: "database",
            port: 8888
        };
        var url = "postgres://" + obj.username + ":" + encodeURIComponent(obj.password) + "@" + obj.host + ":" + obj.port + "/" + obj.database;
        var options = DriverUtils_1.DriverUtils.buildDriverOptions({ url: url });
        chai_1.expect(options.password).to.eql(obj.password);
    });
});
//# sourceMappingURL=issue-3737.js.map