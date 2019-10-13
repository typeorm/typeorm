"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var JoinColumn_1 = require("../../../../../src/decorator/relations/JoinColumn");
var index_1 = require("../../../../../src/index");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var BaseEntity_1 = require("../../../../../src/repository/BaseEntity");
var user_1 = require("./user");
var record_1 = require("./record");
var RecordContext = /** @class */ (function (_super) {
    tslib_1.__extends(RecordContext, _super);
    function RecordContext() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        index_1.PrimaryColumn({ name: "record_id" }),
        tslib_1.__metadata("design:type", String)
    ], RecordContext.prototype, "recordId", void 0);
    tslib_1.__decorate([
        index_1.PrimaryColumn({ name: "user_id" }),
        tslib_1.__metadata("design:type", String)
    ], RecordContext.prototype, "userId", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return record_1.Record; }, function (record) { return record.contexts; }),
        JoinColumn_1.JoinColumn({ name: "record_id" }),
        tslib_1.__metadata("design:type", record_1.Record)
    ], RecordContext.prototype, "record", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return user_1.User; }, function (user) { return user.contexts; }),
        JoinColumn_1.JoinColumn({ name: "user_id" }),
        tslib_1.__metadata("design:type", user_1.User)
    ], RecordContext.prototype, "user", void 0);
    tslib_1.__decorate([
        index_1.Column("simple-json"),
        tslib_1.__metadata("design:type", Object)
    ], RecordContext.prototype, "meta", void 0);
    RecordContext = tslib_1.__decorate([
        Entity_1.Entity({ name: "record_contexts" })
    ], RecordContext);
    return RecordContext;
}(BaseEntity_1.BaseEntity));
exports.RecordContext = RecordContext;
//# sourceMappingURL=context.js.map