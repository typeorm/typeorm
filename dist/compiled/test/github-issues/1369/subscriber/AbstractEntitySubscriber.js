"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var AbstractEntity_1 = require("../entity/AbstractEntity");
var AbstractEntitySubscriber = /** @class */ (function () {
    function AbstractEntitySubscriber() {
    }
    AbstractEntitySubscriber.prototype.listenTo = function () {
        return AbstractEntity_1.AbstractEntity;
    };
    AbstractEntitySubscriber.prototype.beforeInsert = function (event) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                this.updateFullName(event.entity);
                return [2 /*return*/];
            });
        });
    };
    AbstractEntitySubscriber.prototype.beforeUpdate = function (event) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                this.updateFullName(event.entity);
                return [2 /*return*/];
            });
        });
    };
    AbstractEntitySubscriber.prototype.updateFullName = function (o) {
        o.fullname = o.firstname + " " + o.lastname;
    };
    AbstractEntitySubscriber = tslib_1.__decorate([
        index_1.EventSubscriber()
    ], AbstractEntitySubscriber);
    return AbstractEntitySubscriber;
}());
exports.AbstractEntitySubscriber = AbstractEntitySubscriber;
//# sourceMappingURL=AbstractEntitySubscriber.js.map