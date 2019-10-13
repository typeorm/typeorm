"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../../src/decorator/entity/Entity");
var ManyToOne_1 = require("../../../../../../src/decorator/relations/ManyToOne");
var Event_1 = require("./Event");
var User_1 = require("./User");
var EventMember = /** @class */ (function () {
    function EventMember() {
    }
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return Event_1.Event; }, function (event) { return event.members; }, { primary: true }),
        tslib_1.__metadata("design:type", Event_1.Event)
    ], EventMember.prototype, "event", void 0);
    tslib_1.__decorate([
        ManyToOne_1.ManyToOne(function (type) { return User_1.User; }, function (user) { return user.members; }, { primary: true }),
        tslib_1.__metadata("design:type", User_1.User)
    ], EventMember.prototype, "user", void 0);
    EventMember = tslib_1.__decorate([
        Entity_1.Entity()
    ], EventMember);
    return EventMember;
}());
exports.EventMember = EventMember;
//# sourceMappingURL=EventMember.js.map