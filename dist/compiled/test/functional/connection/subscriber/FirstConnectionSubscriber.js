"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var EventSubscriber_1 = require("../../../../src/decorator/listeners/EventSubscriber");
var FirstConnectionSubscriber = /** @class */ (function () {
    function FirstConnectionSubscriber() {
    }
    /**
     * Called after entity insertion.
     */
    FirstConnectionSubscriber.prototype.beforeInsert = function (event) {
        console.log("BEFORE ENTITY INSERTED: ", event.entity);
    };
    FirstConnectionSubscriber = tslib_1.__decorate([
        EventSubscriber_1.EventSubscriber()
    ], FirstConnectionSubscriber);
    return FirstConnectionSubscriber;
}());
exports.FirstConnectionSubscriber = FirstConnectionSubscriber;
//# sourceMappingURL=FirstConnectionSubscriber.js.map