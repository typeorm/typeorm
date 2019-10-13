"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var VersionColumn_1 = require("../../../../../src/decorator/columns/VersionColumn");
var PostWithVersion = /** @class */ (function () {
    function PostWithVersion() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithVersion.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostWithVersion.prototype, "title", void 0);
    tslib_1.__decorate([
        VersionColumn_1.VersionColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithVersion.prototype, "version", void 0);
    PostWithVersion = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostWithVersion);
    return PostWithVersion;
}());
exports.PostWithVersion = PostWithVersion;
//# sourceMappingURL=PostWithVersion.js.map