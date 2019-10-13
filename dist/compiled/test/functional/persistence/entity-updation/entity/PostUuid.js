"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var PostUuid = /** @class */ (function () {
    function PostUuid() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", Number)
    ], PostUuid.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostUuid.prototype, "text", void 0);
    PostUuid = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostUuid);
    return PostUuid;
}());
exports.PostUuid = PostUuid;
//# sourceMappingURL=PostUuid.js.map