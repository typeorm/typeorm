"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var Booking_1 = require("./Booking");
var Contact = /** @class */ (function () {
    function Contact() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Contact.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return Booking_1.Booking; }, function (booking) { return booking.contact; }),
        tslib_1.__metadata("design:type", Array)
    ], Contact.prototype, "bookings", void 0);
    Contact = tslib_1.__decorate([
        index_1.Entity()
    ], Contact);
    return Contact;
}());
exports.Contact = Contact;
//# sourceMappingURL=Contact.js.map