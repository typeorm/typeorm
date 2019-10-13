"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Person_1 = require("./Person");
var ChildEntity_1 = require("../../../../src/decorator/entity/ChildEntity");
var Homesitter = /** @class */ (function (_super) {
    tslib_1.__extends(Homesitter, _super);
    function Homesitter() {
        var _this = _super.call(this) || this;
        _this.type = 2;
        return _this;
    }
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Number)
    ], Homesitter.prototype, "numberOfKids", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Homesitter.prototype, "shared", void 0);
    Homesitter = tslib_1.__decorate([
        ChildEntity_1.ChildEntity(Person_1.PersonType.Homesitter) // required
        ,
        tslib_1.__metadata("design:paramtypes", [])
    ], Homesitter);
    return Homesitter;
}(Person_1.Person));
exports.Homesitter = Homesitter;
//# sourceMappingURL=Homesitter.js.map