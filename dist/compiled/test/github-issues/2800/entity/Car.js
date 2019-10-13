"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Vehicle_1 = require("./Vehicle");
var src_1 = require("../../../../src");
var CarEngine = /** @class */ (function (_super) {
    tslib_1.__extends(CarEngine, _super);
    function CarEngine() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], CarEngine.prototype, "horsePower", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], CarEngine.prototype, "torque", void 0);
    return CarEngine;
}(Vehicle_1.Engine));
exports.CarEngine = CarEngine;
var Car = /** @class */ (function (_super) {
    tslib_1.__extends(Car, _super);
    function Car() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.Column(function (type) { return CarEngine; }, { prefix: "carEngine" }),
        tslib_1.__metadata("design:type", CarEngine)
    ], Car.prototype, "engine", void 0);
    Car = tslib_1.__decorate([
        src_1.ChildEntity()
    ], Car);
    return Car;
}(Vehicle_1.Vehicle));
exports.Car = Car;
//# sourceMappingURL=Car.js.map