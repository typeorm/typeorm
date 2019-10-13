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
    PostSubscriber.prototype.beforeInsert = function (event) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                event.entity.inserted = true;
                return [2 /*return*/];
            });
        });
    };
    PostSubscriber.prototype.beforeUpdate = function (event) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                event.entity.updated = true;
                return [2 /*return*/];
            });
        });
    };
    PostSubscriber = tslib_1.__decorate([
        src_1.EventSubscriber()
    ], PostSubscriber);
    return PostSubscriber;
}());
exports.PostSubscriber = PostSubscriber;
//# sourceMappingURL=PostSubscriber.js.map