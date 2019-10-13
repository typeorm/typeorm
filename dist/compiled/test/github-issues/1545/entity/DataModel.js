"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var MainModel_1 = require("./MainModel");
var ValidationModel_1 = require("./ValidationModel");
var DataModel = /** @class */ (function () {
    function DataModel() {
    }
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return ValidationModel_1.ValidationModel; }, { eager: true, primary: true }),
        index_1.JoinColumn({
            name: "validation",
            referencedColumnName: "validation"
        }),
        tslib_1.__metadata("design:type", ValidationModel_1.ValidationModel)
    ], DataModel.prototype, "validations", void 0);
    tslib_1.__decorate([
        index_1.ManyToOne(function (type) { return MainModel_1.MainModel; }, {
            primary: true
        }),
        index_1.JoinColumn({
            name: "mainId",
            referencedColumnName: "id"
        }),
        tslib_1.__metadata("design:type", MainModel_1.MainModel)
    ], DataModel.prototype, "main", void 0);
    tslib_1.__decorate([
        index_1.Column({
            type: "boolean",
            default: false
        }),
        tslib_1.__metadata("design:type", Boolean)
    ], DataModel.prototype, "active", void 0);
    DataModel = tslib_1.__decorate([
        index_1.Entity()
    ], DataModel);
    return DataModel;
}());
exports.DataModel = DataModel;
//# sourceMappingURL=DataModel.js.map