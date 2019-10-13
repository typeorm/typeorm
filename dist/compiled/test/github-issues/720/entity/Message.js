"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var Message = /** @class */ (function () {
    function Message() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn("increment", { type: "bigint" }),
        tslib_1.__metadata("design:type", String)
    ], Message.prototype, "id", void 0);
    Message = tslib_1.__decorate([
        Entity_1.Entity()
    ], Message);
    return Message;
}());
exports.Message = Message;
//# sourceMappingURL=Message.js.map