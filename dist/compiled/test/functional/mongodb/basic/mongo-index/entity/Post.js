"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ObjectIdColumn_1 = require("../../../../../../src/decorator/columns/ObjectIdColumn");
var Index_1 = require("../../../../../../src/decorator/Index");
var typings_1 = require("../../../../../../src/driver/mongodb/typings");
var Post = /** @class */ (function () {
    function Post() {
    }
    tslib_1.__decorate([
        ObjectIdColumn_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", typings_1.ObjectID)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        Index_1.Index(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        Index_1.Index(),
        tslib_1.__metadata("design:type", String)
    ], Post.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        Index_1.Index({ unique: true }),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "count", void 0);
    Post = tslib_1.__decorate([
        Entity_1.Entity(),
        Index_1.Index(["title", "name"]),
        Index_1.Index(function () { return ({ title: -1, name: -1, count: 1 }); }),
        Index_1.Index("title_name_count", function () { return ({ title: 1, name: 1, count: 1 }); }),
        Index_1.Index("title_name_count_reversed", function () { return ({ title: -1, name: -1, count: -1 }); }),
        Index_1.Index("count_in_background", function () { return ({ count: -1 }); }, { background: true }),
        Index_1.Index("count_expire", function () { return ({ title: -1 }); }, { expireAfterSeconds: 3600 })
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map