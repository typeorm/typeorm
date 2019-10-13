"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var DataModel_1 = require("./DataModel");
var MainModel = /** @class */ (function () {
    function MainModel() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], MainModel.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.OneToMany(function (type) { return DataModel_1.DataModel; }, function (dataModel) { return dataModel.main; }, { cascade: true, eager: true }),
        tslib_1.__metadata("design:type", Array)
    ], MainModel.prototype, "dataModel", void 0);
    MainModel = tslib_1.__decorate([
        index_1.Entity()
    ], MainModel);
    return MainModel;
}());
exports.MainModel = MainModel;
//# sourceMappingURL=MainModel.js.map