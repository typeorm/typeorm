"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Post_1 = require("../entity/Post");
var src_1 = require("../../../../src");
var ExtendedAfterLoadSubscriber = /** @class */ (function () {
    function ExtendedAfterLoadSubscriber() {
    }
    ExtendedAfterLoadSubscriber.prototype.listenTo = function () {
        return Post_1.Post;
    };
    ExtendedAfterLoadSubscriber.prototype.afterLoad = function (entity, event) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                entity.extendedSubscriberSaw = event;
                return [2 /*return*/];
            });
        });
    };
    ExtendedAfterLoadSubscriber = tslib_1.__decorate([
        src_1.EventSubscriber()
    ], ExtendedAfterLoadSubscriber);
    return ExtendedAfterLoadSubscriber;
}());
exports.ExtendedAfterLoadSubscriber = ExtendedAfterLoadSubscriber;
//# sourceMappingURL=ExtendedAfterLoadSubscriber.js.map