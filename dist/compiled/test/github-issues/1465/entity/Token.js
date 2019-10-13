"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Column_1 = require("../../../../src/decorator/columns/Column");
var PrimaryGeneratedColumn_1 = require("../../../../src/decorator/columns/PrimaryGeneratedColumn");
var Entity_1 = require("../../../../src/decorator/entity/Entity");
var TableInheritance_1 = require("../../../../src/decorator/entity/TableInheritance");
var Token = /** @class */ (function () {
    function Token() {
    }
    tslib_1.__decorate([
        PrimaryGeneratedColumn_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Token.prototype, "id", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Token.prototype, "tokenSecret", void 0);
    tslib_1.__decorate([
        Column_1.Column(),
        tslib_1.__metadata("design:type", Date)
    ], Token.prototype, "expiresOn", void 0);
    Token = tslib_1.__decorate([
        Entity_1.Entity(),
        TableInheritance_1.TableInheritance({ column: { type: "varchar", name: "type" } })
    ], Token);
    return Token;
}());
exports.Token = Token;
//# sourceMappingURL=Token.js.map