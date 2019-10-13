"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var OneToOne_1 = require("../../../../src/decorator/relations/OneToOne");
var Request_1 = require("./Request");
var JoinColumn_1 = require("../../../../src/decorator/relations/JoinColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Ticket = /** @class */ (function () {
    function Ticket() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Ticket.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Ticket.prototype, "name", void 0);
    tslib_1.__decorate([
        OneToOne_1.OneToOne(function (type) { return Request_1.Request; }, {
            cascade: true
        }),
        JoinColumn_1.JoinColumn(),
        tslib_1.__metadata("design:type", Request_1.Request)
    ], Ticket.prototype, "request", void 0);
    Ticket = tslib_1.__decorate([
        Entity_1.Entity()
    ], Ticket);
    return Ticket;
}());
exports.Ticket = Ticket;
//# sourceMappingURL=Ticket.js.map