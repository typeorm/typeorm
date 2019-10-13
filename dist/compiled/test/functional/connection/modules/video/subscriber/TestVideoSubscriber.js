"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var EventSubscriber_1 = require("../../../../../../src/decorator/listeners/EventSubscriber");
var TestVideoSubscriber = /** @class */ (function () {
    function TestVideoSubscriber() {
    }
    /**
     * Called after entity insertion.
     */
    TestVideoSubscriber.prototype.beforeInsert = function (event) {
        console.log("BEFORE ENTITY INSERTED: ", event.entity);
    };
    TestVideoSubscriber = tslib_1.__decorate([
        EventSubscriber_1.EventSubscriber()
    ], TestVideoSubscriber);
    return TestVideoSubscriber;
}());
exports.TestVideoSubscriber = TestVideoSubscriber;
//# sourceMappingURL=TestVideoSubscriber.js.map