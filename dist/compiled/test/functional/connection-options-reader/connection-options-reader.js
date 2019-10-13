"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var chai_1 = require("chai");
var ConnectionOptionsReader_1 = require("../../../src/connection/ConnectionOptionsReader");
describe("ConnectionOptionsReader", function () {
    after(function () {
        delete process.env.TYPEORM_CONNECTION;
        delete process.env.TYPEORM_DATABASE;
    });
    it("properly loads config with entities specified", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connectionOptionsReader, options, entities;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({ root: __dirname, configName: "configs/class-entities" });
                    return [4 /*yield*/, connectionOptionsReader.get("test-conn")];
                case 1:
                    options = _a.sent();
                    chai_1.expect(options.entities).to.be.an.instanceOf(Array);
                    entities = options.entities;
                    chai_1.expect(entities.length).to.equal(1);
                    return [2 /*return*/];
            }
        });
    }); });
    it("properly loads sqlite in-memory/path config", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connectionOptionsReader, inmemoryOptions, fileOptions;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({ root: __dirname, configName: "configs/sqlite-memory" });
                    return [4 /*yield*/, connectionOptionsReader.get("memory")];
                case 1:
                    inmemoryOptions = _a.sent();
                    chai_1.expect(inmemoryOptions.database).to.equal(":memory:");
                    return [4 /*yield*/, connectionOptionsReader.get("file")];
                case 2:
                    fileOptions = _a.sent();
                    chai_1.expect(fileOptions.database).to.have.string("/test");
                    return [2 /*return*/];
            }
        });
    }); });
    it("properly loads config with specified file path", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connectionOptionsReader, fileOptions;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({ root: __dirname, configName: "configs/test-path-config.js" });
                    return [4 /*yield*/, connectionOptionsReader.get("file")];
                case 1:
                    fileOptions = _a.sent();
                    chai_1.expect(fileOptions.database).to.have.string("/test-js");
                    return [2 /*return*/];
            }
        });
    }); });
    // TODO This test requires the configs/.env file be moved to the matching directory in build/compiled
    it.skip("properly loads config from .env file", function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var connectionOptionsReader, _a, fileOptions;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    connectionOptionsReader = new ConnectionOptionsReader_1.ConnectionOptionsReader({ root: __dirname, configName: "configs/.env" });
                    return [4 /*yield*/, connectionOptionsReader.all()];
                case 1:
                    _a = tslib_1.__read.apply(void 0, [_b.sent(), 1]), fileOptions = _a[0];
                    chai_1.expect(fileOptions.database).to.have.string("test-js");
                    chai_1.expect(process.env.TYPEORM_DATABASE).to.equal("test-js");
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=connection-options-reader.js.map