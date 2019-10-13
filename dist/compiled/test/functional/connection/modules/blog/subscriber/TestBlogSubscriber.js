"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var EventSubscriber_1 = require("../../../../../../src/decorator/listeners/EventSubscriber");
var TestBlogSubscriber = /** @class */ (function () {
    function TestBlogSubscriber() {
    }
    /**
     * Called after entity insertion.
     */
    TestBlogSubscriber.prototype.beforeInsert = function (event) {
        console.log("BEFORE ENTITY INSERTED: ", event.entity);
    };
    TestBlogSubscriber = tslib_1.__decorate([
        EventSubscriber_1.EventSubscriber()
    ], TestBlogSubscriber);
    return TestBlogSubscriber;
}());
exports.TestBlogSubscriber = TestBlogSubscriber;
//# sourceMappingURL=TestBlogSubscriber.js.map