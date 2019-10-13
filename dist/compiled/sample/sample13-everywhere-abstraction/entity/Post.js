"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var PostCategory_1 = require("./PostCategory");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var BaseObject_1 = require("./BaseObject");
var Post = /** @class */ (function (_super) {
    tslib_1.__extends(Post, _super);
    function Post() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.categories = [];
        return _this;
    }
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "text", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return PostCategory_1.PostCategory; }, function (category) { return category.posts; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Post.prototype, "categories", void 0);
    Post = tslib_1.__decorate([
        index_1.Entity("sample13_post")
    ], Post);
    return Post;
}(BaseObject_1.BaseObject));
exports.Post = Post;
//# sourceMappingURL=Post.js.map