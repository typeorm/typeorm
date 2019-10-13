"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var VersionColumn_1 = require("../../../../../src/decorator/columns/VersionColumn");
var UpdateDateColumn_1 = require("../../../../../src/decorator/columns/UpdateDateColumn");
var PostWithVersionAndUpdatedDate = /** @class */ (function () {
    function PostWithVersionAndUpdatedDate() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithVersionAndUpdatedDate.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostWithVersionAndUpdatedDate.prototype, "title", void 0);
    tslib_1.__decorate([
        VersionColumn_1.VersionColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithVersionAndUpdatedDate.prototype, "version", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], PostWithVersionAndUpdatedDate.prototype, "updateDate", void 0);
    PostWithVersionAndUpdatedDate = tslib_1.__decorate([
        Entity_1.Entity("post_with_v_ud")
    ], PostWithVersionAndUpdatedDate);
    return PostWithVersionAndUpdatedDate;
}());
exports.PostWithVersionAndUpdatedDate = PostWithVersionAndUpdatedDate;
//# sourceMappingURL=PostWithVersionAndUpdatedDate.js.map