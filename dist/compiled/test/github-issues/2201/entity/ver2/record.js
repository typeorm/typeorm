"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../../src/index");
var Entity_1 = require("../../../../../src/decorator/entity/Entity");
var BaseEntity_1 = require("../../../../../src/repository/BaseEntity");
var context_1 = require("./context");
var Record = /** @class */ (function (_super) {
    tslib_1.__extends(Record, _super);
    function Record() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        index_1.PrimaryColumn(),
        tslib_1.__metadata("design:type", String)
    ], Record.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return context_1.RecordContext; }, function (context) { return context.record; }),
        tslib_1.__metadata("design:type", Array)
    ], Record.prototype, "contexts", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Record.prototype, "status", void 0);
    Record = tslib_1.__decorate([
        Entity_1.Entity({ name: "records" })
    ], Record);
    return Record;
}(BaseEntity_1.BaseEntity));
exports.Record = Record;
//# sourceMappingURL=record.js.map