"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Vehicle_1 = require("./Vehicle");
var src_1 = require("../../../../src");
var PlaneEngine = /** @class */ (function (_super) {
    tslib_1.__extends(PlaneEngine, _super);
    function PlaneEngine() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], PlaneEngine.prototype, "beep", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], PlaneEngine.prototype, "boop", void 0);
    return PlaneEngine;
}(Vehicle_1.Engine));
exports.PlaneEngine = PlaneEngine;
var Plane = /** @class */ (function (_super) {
    tslib_1.__extends(Plane, _super);
    function Plane() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column(function (type) { return PlaneEngine; }, { prefix: "planeEngine" }),
        tslib_1.__metadata("design:type", PlaneEngine)
    ], Plane.prototype, "engine", void 0);
    Plane = tslib_1.__decorate([
        src_1.ChildEntity()
    ], Plane);
    return Plane;
}(Vehicle_1.Vehicle));
exports.Plane = Plane;
//# sourceMappingURL=Plane.js.map