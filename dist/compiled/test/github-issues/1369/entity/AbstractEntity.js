"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var AbstractEntity = /** @class */ (function () {
    function AbstractEntity() {
    }
    tslib_1.__decorate([
        index_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], AbstractEntity.prototype, "id", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], AbstractEntity.prototype, "firstname", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], AbstractEntity.prototype, "lastname", void 0);
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], AbstractEntity.prototype, "fullname", void 0);
    return AbstractEntity;
}());
exports.AbstractEntity = AbstractEntity;
//# sourceMappingURL=AbstractEntity.js.map