"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../src/index");
var BasePost_1 = require("./BasePost");
var ManyToOne_1 = require("../../../src/decorator/relations/ManyToOne");
var PostAuthor_1 = require("./PostAuthor");
var ManyToMany_1 = require("../../../src/decorator/relations/ManyToMany");
var PostCategory_1 = require("./PostCategory");
var JoinTable_1 = require("../../../src/decorator/relations/JoinTable");
var Blog = /** @class */ (function (_super) {
    tslib_1.__extends(Blog, _super);
    function Blog() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.categories = [];
        return _this;
    }
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Blog.prototype, "text", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return PostAuthor_1.PostAuthor; }, function (post) { return post.posts; }, {
            cascade: true
        }),
        tslib_1.__metadata("design:type", PostAuthor_1.PostAuthor)
    ], Blog.prototype, "author", void 0);
    tslib_1.__decorate([
        ManyToMany_1.ManyToMany(function (type) { return PostCategory_1.PostCategory; }, function (category) { return category.posts; }, {
            cascade: true
        }),
        JoinTable_1.JoinTable(),
        tslib_1.__metadata("design:type", Array)
    ], Blog.prototype, "categories", void 0);
    Blog = tslib_1.__decorate([
        index_1.Entity("sample6_blog")
    ], Blog);
    return Blog;
}(BasePost_1.BasePost));
exports.Blog = Blog;
//# sourceMappingURL=Blog.js.map