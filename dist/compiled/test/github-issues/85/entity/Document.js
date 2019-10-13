"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Document = /** @class */ (function () {
    function Document() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Document.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ nullable: true, select: false }),
        tslib_1.__metadata("design:type", String)
    ], Document.prototype, "name", void 0);
    tslib_1.__decorate([
        src_1.Column({ insert: false, select: false, nullable: true }),
        tslib_1.__metadata("design:type", Number)
    ], Document.prototype, "permission", void 0);
    tslib_1.__decorate([
        src_1.Column({ insert: false, default: 1 }),
        tslib_1.__metadata("design:type", Number)
    ], Document.prototype, "version", void 0);
    Document = tslib_1.__decorate([
        src_1.Entity()
    ], Document);
    return Document;
}());
exports.Document = Document;
//# sourceMappingURL=Document.js.map