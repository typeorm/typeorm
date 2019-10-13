"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var typings_1 = require("../../../../src/driver/mongodb/typings");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var ObjectIdColumn_1 = require("../../../../src/decorator/columns/ObjectIdColumn");
var Column_1 = require("../../../../src/decorator/columns/Column");
var Event = /** @class */ (function () {
    function Event() {
    }
    tslib_1.__decorate([
        ObjectIdColumn_1.ObjectIdColumn(),
        tslib_1.__metadata("design:type", typings_1.ObjectID)
    ], Event.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Event.prototype, "name", void 0);
    tslib_1.__decorate([
        Column_1.Column({ name: "at_date", default: Date.now }),
        tslib_1.__metadata("design:type", Date)
    ], Event.prototype, "date", void 0);
    Event = tslib_1.__decorate([
        Entity_1.Entity()
    ], Event);
    return Event;
}());
exports.Event = Event;
//# sourceMappingURL=Event.js.map