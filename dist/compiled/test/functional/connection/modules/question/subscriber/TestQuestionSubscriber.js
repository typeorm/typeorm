"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var EventSubscriber_1 = require("../../../../../../src/decorator/listeners/EventSubscriber");
var TestQuestionSubscriber = /** @class */ (function () {
    function TestQuestionSubscriber() {
    }
    /**
     * Called before entity insertion.
     */
    TestQuestionSubscriber.prototype.beforeInsert = function (event) {
        console.log("BEFORE ENTITY INSERTED: ", event.entity);
    };
    TestQuestionSubscriber = tslib_1.__decorate([
        EventSubscriber_1.EventSubscriber()
    ], TestQuestionSubscriber);
    return TestQuestionSubscriber;
}());
exports.TestQuestionSubscriber = TestQuestionSubscriber;
//# sourceMappingURL=TestQuestionSubscriber.js.map