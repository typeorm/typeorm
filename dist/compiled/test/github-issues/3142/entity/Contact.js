"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Contact = /** @class */ (function () {
    function Contact() {
    }
    tslib_1.__decorate([
        src_1.Column({ unique: true }),
        tslib_1.__metadata("design:type", String)
    ], Contact.prototype, "email", void 0);
    return Contact;
}());
exports.Contact = Contact;
//# sourceMappingURL=Contact.js.map