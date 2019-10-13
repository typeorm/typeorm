"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Engine = /** @class */ (function () {
    function Engine() {
    }
    return Engine;
}());
exports.Engine = Engine;
var Vehicle = /** @class */ (function () {
    function Vehicle() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Vehicle.prototype, "id", void 0);
    Vehicle = tslib_1.__decorate([
        src_1.Entity(),
        src_1.TableInheritance({ column: { name: "type", type: "varchar" } })
    ], Vehicle);
    return Vehicle;
}());
exports.Vehicle = Vehicle;
//# sourceMappingURL=Vehicle.js.map