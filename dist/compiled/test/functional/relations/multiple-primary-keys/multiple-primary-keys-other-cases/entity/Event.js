"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var OneToMany_1 = require("../../../../../../src/decorator/relations/OneToMany");
var Column_1 = require("../../../../../../src/decorator/columns/Column");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var EventMember_1 = require("./EventMember");
var Person_1 = require("./Person");
var Event = /** @class */ (function () {
    function Event() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Event.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Event.prototype, "name", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Person_1.Person; }),
        tslib_1.__metadata("design:type", Person_1.Person)
    ], Event.prototype, "author", void 0);
    tslib_1.__decorate([
        OneToMany_1.OneToMany(function (type) { return EventMember_1.EventMember; }, function (member) { return member.event; }),
        tslib_1.__metadata("design:type", Array)
    ], Event.prototype, "members", void 0);
    Event = tslib_1.__decorate([
        Entity_1.Entity()
    ], Event);
    return Event;
}());
exports.Event = Event;
//# sourceMappingURL=Event.js.map