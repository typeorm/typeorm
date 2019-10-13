"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var MariadbEntity = /** @class */ (function () {
    function MariadbEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], MariadbEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("time"),
        tslib_1.__metadata("design:type", Date)
    ], MariadbEntity.prototype, "fieldTime", void 0);
    tslib_1.__decorate([
        src_1.Column("timestamp"),
        tslib_1.__metadata("design:type", Date)
    ], MariadbEntity.prototype, "fieldTimestamp", void 0);
    tslib_1.__decorate([
        src_1.Column("datetime"),
        tslib_1.__metadata("design:type", Date)
    ], MariadbEntity.prototype, "fieldDatetime", void 0);
    MariadbEntity = tslib_1.__decorate([
        src_1.Entity()
    ], MariadbEntity);
    return MariadbEntity;
}());
exports.MariadbEntity = MariadbEntity;
//# sourceMappingURL=mariadbEntity.js.map