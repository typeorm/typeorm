"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Event_1 = require("./Event");
var Role_1 = require("./Role");
var EventRole = /** @class */ (function () {
    function EventRole() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], EventRole.prototype, "eventId", void 0);
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], EventRole.prototype, "roleId", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], EventRole.prototype, "description", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], EventRole.prototype, "compensation", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return Role_1.Role; }, function (role) { return role.roles; }, {
            onDelete: "CASCADE"
        }),
        tslib_1.__metadata("design:type", Role_1.Role)
    ], EventRole.prototype, "role", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function (type) { return Event_1.Event; }, function (event) { return event.roles; }, {
            onDelete: "CASCADE"
        }),
        tslib_1.__metadata("design:type", Event_1.Event)
    ], EventRole.prototype, "event", void 0);
    EventRole = tslib_1.__decorate([
        src_1.Entity()
    ], EventRole);
    return EventRole;
}());
exports.EventRole = EventRole;
//# sourceMappingURL=EventRole.js.map