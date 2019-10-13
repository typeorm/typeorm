"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var src_1 = require("../../../../../src");
var PersonAR = /** @class */ (function (_super) {
    tslib_1.__extends(PersonAR, _super);
    function PersonAR() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PersonAR.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PersonAR.prototype, "name", void 0);
    PersonAR = tslib_1.__decorate([
        Entity_1.Entity()
    ], PersonAR);
    return PersonAR;
}(src_1.BaseEntity));
exports.PersonAR = PersonAR;
//# sourceMappingURL=PersonAR.js.map