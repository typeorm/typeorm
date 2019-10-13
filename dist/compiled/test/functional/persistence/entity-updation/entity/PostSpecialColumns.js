"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var CreateDateColumn_1 = require("../../../../../src/decorator/columns/CreateDateColumn");
var UpdateDateColumn_1 = require("../../../../../src/decorator/columns/UpdateDateColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var VersionColumn_1 = require("../../../../../src/decorator/columns/VersionColumn");
var PostSpecialColumns = /** @class */ (function () {
    function PostSpecialColumns() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostSpecialColumns.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostSpecialColumns.prototype, "title", void 0);
    tslib_1.__decorate([
        CreateDateColumn_1.CreateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], PostSpecialColumns.prototype, "createDate", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], PostSpecialColumns.prototype, "updateDate", void 0);
    tslib_1.__decorate([
        VersionColumn_1.VersionColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostSpecialColumns.prototype, "version", void 0);
    PostSpecialColumns = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostSpecialColumns);
    return PostSpecialColumns;
}());
exports.PostSpecialColumns = PostSpecialColumns;
//# sourceMappingURL=PostSpecialColumns.js.map