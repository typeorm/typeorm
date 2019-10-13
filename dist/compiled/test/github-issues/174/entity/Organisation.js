"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Contact_1 = require("./Contact");
var Organisation = /** @class */ (function () {
    function Organisation() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Organisation.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Organisation.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column(function (type) { return Contact_1.Contact; }),
        tslib_1.__metadata("design:type", Contact_1.Contact)
    ], Organisation.prototype, "contact", void 0);
    Organisation = tslib_1.__decorate([
        Entity_1.Entity()
    ], Organisation);
    return Organisation;
}());
exports.Organisation = Organisation;
//# sourceMappingURL=Organisation.js.map