"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Contact_1 = require("./Contact");
var Booking = /** @class */ (function () {
    function Booking() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Booking.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return Contact_1.Contact; }, function (contact) { return contact.bookings; }, { eager: true }),
        index_1.JoinColumn({
            name: "contact_id",
        }),
        tslib_1.__metadata("design:type", Contact_1.Contact)
    ], Booking.prototype, "contact", void 0);
    Booking = tslib_1.__decorate([
        index_1.Entity()
    ], Booking);
    return Booking;
}());
exports.Booking = Booking;
//# sourceMappingURL=Booking.js.map