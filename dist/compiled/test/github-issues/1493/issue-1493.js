"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var DriverUtils_1 = require("../../../src/driver/DriverUtils");
var chai_1 = require("chai");
// import {exec} from "child_process";
describe("github issues > #1493 Error parsing pg connection string", function () {
    it("should parse common connection url", function () {
        var e_1, _a;
        var obj = {
            username: "username",
            password: "password",
            host: "host",
            database: "database",
            port: 8888
        };
        var url = "postgres://" + obj.username + ":" + obj.password + "@" + obj.host + ":" + obj.port + "/" + obj.database;
        var options = DriverUtils_1.DriverUtils.buildDriverOptions({ url: url });
        try {
            for (var _b = tslib_1.__values(Object.keys(obj)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var key = _c.value;
                chai_1.expect(options[key]).to.eql(obj[key]);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    });
    it("should parse url with password contains colons", function () {
        var obj = {
            username: "username",
            password: "pas:swo:rd",
            host: "host",
            database: "database",
            port: 8888
        };
        var url = "postgres://" + obj.username + ":" + obj.password + "@" + obj.host + ":" + obj.port + "/" + obj.database;
        var options = DriverUtils_1.DriverUtils.buildDriverOptions({ url: url });
        chai_1.expect(options.password).to.eql(obj.password);
    });
    it("should parse url with username and password contains at signs", function () {
        var obj = {
            username: "usern@me",
            password: "p@ssword",
            host: "host",
            database: "database",
            port: 8888
        };
        var url = "postgres://" + obj.username + ":" + obj.password + "@" + obj.host + ":" + obj.port + "/" + obj.database;
        var options = DriverUtils_1.DriverUtils.buildDriverOptions({ url: url });
        chai_1.expect(options.username).to.eql(obj.username);
        chai_1.expect(options.password).to.eql(obj.password);
    });
});
//# sourceMappingURL=issue-1493.js.map