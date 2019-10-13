"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var src_2 = require("../../../../src");
var Author = /** @class */ (function () {
    function Author() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn("uuid"),
        tslib_1.__metadata("design:type", String)
    ], Author.prototype, "id", void 0);
    Author = tslib_1.__decorate([
        src_2.Entity()
    ], Author);
    return Author;
}());
exports.Author = Author;
//# sourceMappingURL=Author.js.map