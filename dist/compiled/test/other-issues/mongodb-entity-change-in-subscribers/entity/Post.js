"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var UpdateDateColumn_1 = require("../../../../src/decorator/columns/UpdateDateColumn");
var src_1 = require("../../../../src");
var Post = /** @class */ (function () {
    function Post() {
        this.active = false;
        this.updatedColumns = 0;
        this.loaded = false;
    }
    tslib_1.__decorate([
        src_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", src_1.ObjectID)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Post.prototype, "active", void 0);
    tslib_1.__decorate([
        UpdateDateColumn_1.UpdateDateColumn(),
        tslib_1.__metadata("design:type", Date)
    ], Post.prototype, "updateDate", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Object)
    ], Post.prototype, "updatedColumns", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map