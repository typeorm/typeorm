"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var EventRole_1 = require("./EventRole");
var Event = /** @class */ (function () {
    function Event() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Event.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Event.prototype, "title", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return EventRole_1.EventRole; }, function (role) { return role.event; }, {
            // eager: true,
            // persistence: true,
            cascade: true,
        }),
        tslib_1.__metadata("design:type", Array)
    ], Event.prototype, "roles", void 0);
    Event = tslib_1.__decorate([
        index_1.Entity()
    ], Event);
    return Event;
}());
exports.Event = Event;
//# sourceMappingURL=Event.js.map