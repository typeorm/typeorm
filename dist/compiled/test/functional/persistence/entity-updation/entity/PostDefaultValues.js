"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var PrimaryGeneratedColumn_1 = require("../../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Column_1 = require("../../../../../src/decorator/columns/Column");
var PostDefaultValues = /** @class */ (function () {
    function PostDefaultValues() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostDefaultValues.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], PostDefaultValues.prototype, "title", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: "hello post" }),
        tslib_1.__metadata("design:type", String)
    ], PostDefaultValues.prototype, "text", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: true }),
        tslib_1.__metadata("design:type", Boolean)
    ], PostDefaultValues.prototype, "isActive", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: function () { return "CURRENT_TIMESTAMP"; } }),
        tslib_1.__metadata("design:type", Date)
    ], PostDefaultValues.prototype, "addDate", void 0);
    tslib_1.__decorate([
        Column_1.Column({ default: 0 }),
        tslib_1.__metadata("design:type", Number)
    ], PostDefaultValues.prototype, "views", void 0);
    tslib_1.__decorate([
        Column_1.Column({ nullable: true }),
        tslib_1.__metadata("design:type", String)
    ], PostDefaultValues.prototype, "description", void 0);
    PostDefaultValues = tslib_1.__decorate([
        Entity_1.Entity()
    ], PostDefaultValues);
    return PostDefaultValues;
}());
exports.PostDefaultValues = PostDefaultValues;
//# sourceMappingURL=PostDefaultValues.js.map