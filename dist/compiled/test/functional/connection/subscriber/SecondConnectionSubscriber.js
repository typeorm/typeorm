"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var EventSubscriber_1 = require("../../../../src/decorator/listeners/EventSubscriber");
var SecondConnectionSubscriber = /** @class */ (function () {
    function SecondConnectionSubscriber() {
    }
    /**
     * Called after entity insertion.
     */
    SecondConnectionSubscriber.prototype.beforeInsert = function (event) {
        console.log("BEFORE ENTITY INSERTED: ", event.entity);
    };
    SecondConnectionSubscriber = tslib_1.__decorate([
        EventSubscriber_1.EventSubscriber()
    ], SecondConnectionSubscriber);
    return SecondConnectionSubscriber;
}());
exports.SecondConnectionSubscriber = SecondConnectionSubscriber;
//# sourceMappingURL=SecondConnectionSubscriber.js.map