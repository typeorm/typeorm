"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../src/decorator/relations/ManyToOne");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Company_1 = require("./Company");
var Office = /** @class */ (function () {
    function Office() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Office.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Office.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Company_1.Company; }, function (company) { return company.id; }, {
            deferrable: "INITIALLY IMMEDIATE",
        }),
        tslib_1.__metadata("design:type", Company_1.Company)
    ], Office.prototype, "company", void 0);
    Office = tslib_1.__decorate([
        Entity_1.Entity()
    ], Office);
    return Office;
}());
exports.Office = Office;
//# sourceMappingURL=Office.js.map