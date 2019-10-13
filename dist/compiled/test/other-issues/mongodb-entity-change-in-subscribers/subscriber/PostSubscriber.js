"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Post_1 = require("../entity/Post");
var src_1 = require("../../../../src");
var PostSubscriber = /** @class */ (function () {
    function PostSubscriber() {
    }
    PostSubscriber.prototype.listenTo = function () {
        return Post_1.Post;
    };
    PostSubscriber.prototype.beforeUpdate = function (event) {
        event.entity.updatedColumns = event.updatedColumns.length;
    };
    PostSubscriber.prototype.afterLoad = function (entity) {
        entity.loaded = true;
    };
    PostSubscriber = tslib_1.__decorate([
        src_1.EventSubscriber()
    ], PostSubscriber);
    return PostSubscriber;
}());
exports.PostSubscriber = PostSubscriber;
//# sourceMappingURL=PostSubscriber.js.map