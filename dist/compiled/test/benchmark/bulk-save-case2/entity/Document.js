"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryColumn_1 = require("../../../../src/decorator/columns/PrimaryColumn");
var Document = /** @class */ (function () {
    function Document() {
    }
    tslib_1.__decorate([
        PrimaryColumn_1.PrimaryColumn("text"),
        tslib_1.__metadata("design:type", String)
    ], Document.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Document.prototype, "docId", void 0);
    tslib_1.__decorate([
        Column_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Document.prototype, "label", void 0);
    tslib_1.__decorate([
        Column_1.Column("text"),
        tslib_1.__metadata("design:type", String)
    ], Document.prototype, "context", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "jsonb" }),
        tslib_1.__metadata("design:type", Array)
    ], Document.prototype, "distributions", void 0);
    tslib_1.__decorate([
        Column_1.Column({ type: "timestamp with time zone" }),
        tslib_1.__metadata("design:type", Date)
    ], Document.prototype, "date", void 0);
    Document = tslib_1.__decorate([
        Entity_1.Entity()
    ], Document);
    return Document;
}());
exports.Document = Document;
//# sourceMappingURL=Document.js.map