"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var UpdateDateColumn_1 = require("../../../../../src/decorator/columns/UpdateDateColumn");
var PostWithUpdateDate = /** @class */ (function () {
    function PostWithUpdateDate() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostWithUpdateDate.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostWithUpdateDate.prototype, "title", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], PostWithUpdateDate.prototype, "updateDate", void 0);
    PostWithUpdateDate = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostWithUpdateDate);
    return PostWithUpdateDate;
}());
exports.PostWithUpdateDate = PostWithUpdateDate;
//# sourceMappingURL=PostWithUpdateDate.js.map