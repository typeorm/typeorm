"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var documentEnum_1 = require("../documentEnum");
var enumTools_1 = require("../enumTools");
var Bar = /** @class */ (function (_super) {
    tslib_1.__extends(Bar, _super);
    function Bar() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Bar.prototype, "barId", void 0);
    tslib_1.__decorate([
        src_1.Column({
            type: "enum",
            enum: enumTools_1.getEnumValues(documentEnum_1.DocumentEnum),
            array: true,
        }),
        tslib_1.__metadata("design:type", Array)
    ], Bar.prototype, "documents", void 0);
    Bar = tslib_1.__decorate([
        Entity_1.Entity()
    ], Bar);
    return Bar;
}(src_1.BaseEntity));
exports.Bar = Bar;
//# sourceMappingURL=Bar.js.map