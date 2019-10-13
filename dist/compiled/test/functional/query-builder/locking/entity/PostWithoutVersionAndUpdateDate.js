"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PostWithoutVersionAndUpdateDate = /** @class */ (function () {
    function PostWithoutVersionAndUpdateDate() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithoutVersionAndUpdateDate.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostWithoutVersionAndUpdateDate.prototype, "title", void 0);
    PostWithoutVersionAndUpdateDate = tslib_1.__decorate([
        Entity_1.Entity("post_without_v_ud")
    ], PostWithoutVersionAndUpdateDate);
    return PostWithoutVersionAndUpdateDate;
}());
exports.PostWithoutVersionAndUpdateDate = PostWithoutVersionAndUpdateDate;
//# sourceMappingURL=PostWithoutVersionAndUpdateDate.js.map