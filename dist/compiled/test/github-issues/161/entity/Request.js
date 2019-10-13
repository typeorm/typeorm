"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var Ticket_1 = require("./Ticket");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Request = /** @class */ (function () {
    function Request() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Request.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Request.prototype, "owner", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Request.prototype, "type", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Boolean)
    ], Request.prototype, "success", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Ticket_1.Ticket; }, function (ticket) { return ticket.request; }),
        tslib_1.__metadata("design:type", Ticket_1.Ticket)
    ], Request.prototype, "ticket", void 0);
    Request = tslib_1.__decorate([
        Entity_1.Entity()
    ], Request);
    return Request;
}());
exports.Request = Request;
//# sourceMappingURL=Request.js.map