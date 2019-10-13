"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var cliente_1 = require("./cliente");
var TipoCliente = /** @class */ (function () {
    function TipoCliente() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], TipoCliente.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column({ name: "tipo" }),
        tslib_1.__metadata("design:type", String)
    ], TipoCliente.prototype, "descricao", void 0);
    tslib_1.__decorate([
        src_1.OneToMany(function () { return cliente_1.Cliente; }, function (c) { return c.tipo; }),
        tslib_1.__metadata("design:type", Array)
    ], TipoCliente.prototype, "clientes", void 0);
    TipoCliente = tslib_1.__decorate([
        src_1.Entity()
    ], TipoCliente);
    return TipoCliente;
}());
exports.TipoCliente = TipoCliente;
//# sourceMappingURL=tipo-cliente.js.map