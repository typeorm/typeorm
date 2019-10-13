"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var PostgresEntity = /** @class */ (function () {
    function PostgresEntity() {
    }
    tslib_1.__decorate([
        src_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", Number)
    ], PostgresEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column("time"),
        tslib_1.__metadata("design:type", Date)
    ], PostgresEntity.prototype, "fieldTime", void 0);
    tslib_1.__decorate([
        src_1.Column("time with time zone"),
        tslib_1.__metadata("design:type", Date)
    ], PostgresEntity.prototype, "fieldTimeWithTimeZone", void 0);
    tslib_1.__decorate([
        src_1.Column("time without time zone"),
        tslib_1.__metadata("design:type", Date)
    ], PostgresEntity.prototype, "fieldTimeWithoutTimeZone", void 0);
    tslib_1.__decorate([
        src_1.Column("timestamp"),
        tslib_1.__metadata("design:type", Date)
    ], PostgresEntity.prototype, "fieldTimestamp", void 0);
    tslib_1.__decorate([
        src_1.Column("timestamp without time zone"),
        tslib_1.__metadata("design:type", Date)
    ], PostgresEntity.prototype, "fieldTimestampWithoutTimeZone", void 0);
    tslib_1.__decorate([
        src_1.Column("timestamp with time zone"),
        tslib_1.__metadata("design:type", Date)
    ], PostgresEntity.prototype, "fieldTimestampWithTimeZone", void 0);
    PostgresEntity = tslib_1.__decorate([
        src_1.Entity()
    ], PostgresEntity);
    return PostgresEntity;
}());
exports.PostgresEntity = PostgresEntity;
//# sourceMappingURL=postgresEntity.js.map