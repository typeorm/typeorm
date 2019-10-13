"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var BeforeUpdate_1 = require("../../../../src/decorator/listeners/BeforeUpdate");
var UpdateDateColumn_1 = require("../../../../src/decorator/columns/UpdateDateColumn");
var src_1 = require("../../../../src");
var Post = /** @class */ (function () {
    function Post() {
        this.loaded = false;
    }
    Post.prototype.beforeUpdate = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                this.title += "!";
                return [2 /*return*/];
            });
        });
    };
    Post.prototype.afterLoad = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                this.loaded = true;
                return [2 /*return*/];
            });
        });
    };
    tslib_1.__decorate([
        src_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: false }),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "active", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "updateDate", void 0);
    tslib_1.__decorate([
        BeforeUpdate_1.BeforeUpdate(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", Promise)
    ], Post.prototype, "beforeUpdate", null);
    tslib_1.__decorate([
        src_1.AfterLoad(),
        tslib_1.__metadata("design:type", Function),
        tslib_1.__metadata("design:paramtypes", []),
        tslib_1.__metadata("design:returntype", Promise)
    ], Post.prototype, "afterLoad", null);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map