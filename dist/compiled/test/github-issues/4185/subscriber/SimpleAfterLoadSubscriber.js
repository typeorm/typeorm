"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Post_1 = require("../entity/Post");
var src_1 = require("../../../../src");
// "Old" subscribers which only take one parameter should still compile and work
var SimpleAfterLoadSubscriber = /** @class */ (function () {
    function SimpleAfterLoadSubscriber() {
    }
    SimpleAfterLoadSubscriber.prototype.listenTo = function () {
        return Post_1.Post;
    };
    SimpleAfterLoadSubscriber.prototype.afterLoad = function (entity) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                entity.simpleSubscriberSaw = true;
                return [2 /*return*/];
            });
        });
    };
    SimpleAfterLoadSubscriber = tslib_1.__decorate([
        src_1.EventSubscriber()
    ], SimpleAfterLoadSubscriber);
    return SimpleAfterLoadSubscriber;
}());
exports.SimpleAfterLoadSubscriber = SimpleAfterLoadSubscriber;
//# sourceMappingURL=SimpleAfterLoadSubscriber.js.map