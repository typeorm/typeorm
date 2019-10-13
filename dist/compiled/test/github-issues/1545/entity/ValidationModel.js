"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var DataModel_1 = require("./DataModel");
var ValidationModel = /** @class */ (function () {
    function ValidationModel() {
    }
    tslib_1.__decorate([
        index_1.Column({
            type: "integer",
            primary: true
        }),
        tslib_1.__metadata("design:type", Number)
    ], ValidationModel.prototype, "validation", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return DataModel_1.DataModel; }, function (dataModel) { return dataModel.validations; }),
        tslib_1.__metadata("design:type", Array)
    ], ValidationModel.prototype, "dataModel", void 0);
    ValidationModel = tslib_1.__decorate([
        index_1.Entity()
    ], ValidationModel);
    return ValidationModel;
}());
exports.ValidationModel = ValidationModel;
//# sourceMappingURL=ValidationModel.js.map