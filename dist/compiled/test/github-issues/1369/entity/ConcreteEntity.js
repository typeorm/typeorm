"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var index_1 = require("../../../../src/index");
var AbstractEntity_1 = require("./AbstractEntity");
var ConcreteEntity = /** @class */ (function (_super) {
    tslib_1.__extends(ConcreteEntity, _super);
    function ConcreteEntity() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    tslib_1.__decorate([
        index_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], ConcreteEntity.prototype, "position", void 0);
    ConcreteEntity = tslib_1.__decorate([
        index_1.Entity()
    ], ConcreteEntity);
    return ConcreteEntity;
}(AbstractEntity_1.AbstractEntity));
exports.ConcreteEntity = ConcreteEntity;
//# sourceMappingURL=ConcreteEntity.js.map