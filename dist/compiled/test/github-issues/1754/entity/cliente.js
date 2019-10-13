"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var src_1 = require("../../../../src");
var tipo_cliente_1 = require("./tipo-cliente");
var Cliente = /** @class */ (function () {
    function Cliente() {
    }
    tslib_1.__decorate([
        src_1.PrimaryGeneratedColumn(),
        tslib_1.__metadata("design:type", Number)
    ], Cliente.prototype, "id", void 0);
    tslib_1.__decorate([
        src_1.Column(),
        tslib_1.__metadata("design:type", String)
    ], Cliente.prototype, "nome", void 0);
    tslib_1.__decorate([
        src_1.ManyToOne(function () { return tipo_cliente_1.TipoCliente; }, function (tc) { return tc.clientes; }),
        src_1.JoinColumn({ name: "tipoCliente" }),
        tslib_1.__metadata("design:type", tipo_cliente_1.TipoCliente)
    ], Cliente.prototype, "tipo", void 0);
    Cliente = tslib_1.__decorate([
        src_1.Entity()
    ], Cliente);
    return Cliente;
}());
exports.Cliente = Cliente;
//# sourceMappingURL=cliente.js.map