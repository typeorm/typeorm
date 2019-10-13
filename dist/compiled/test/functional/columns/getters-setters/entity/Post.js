"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Post = /** @class */ (function () {
    function Post() {
    }
    Object.defineProperty(Post.prototype, "title", {
        get: function () {
            return this._title;
        },
        set: function (title) {
            // this._title = "!" + title + "!"; // if you'll do "append" like this, you won't get expected results, because setter is called multiple times
            if (title === "hello") {
                this._title = "bye";
            }
            else {
                this._title = title;
            }
        },
        enumerable: true,
        configurable: true
    });
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Post.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String),
        tslib_1.__metadata("design:paramtypes", [String])
    ], Post.prototype, "title", null);
    Post = tslib_1.__decorate([
        Entity_1.Entity()
    ], Post);
    return Post;
}());
exports.Post = Post;
//# sourceMappingURL=Post.js.map