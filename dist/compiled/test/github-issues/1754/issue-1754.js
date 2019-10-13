"use strict";
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var cliente_1 = require("./entity/cliente");
require("reflect-metadata");
var test_utils_1 = require("../../utils/test-utils");
var tipo_cliente_1 = require("./entity/tipo-cliente");
describe("github issue #1754 Repository.save() always updating ManyToOne relation", function () {
    var connections;
    before(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, test_utils_1.createTestingConnections({
                        entities: [__dirname + "/entity/*{.js,.ts}"],
                        enabledDrivers: ["mysql"]
                    })];
                case 1: return [2 /*return*/, connections = _a.sent()];
            }
        });
    }); });
    beforeEach(function () { return test_utils_1.reloadTestingDatabases(connections); });
    after(function () { return test_utils_1.closeTestingConnections(connections); });
    it("should work as expected", function () { return Promise.all(connections.map(function (connection) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var tipoCliente1, tipoCliente2, cliente, myReceivedJson1, myReceivedJson2, clienteDb1, myReceivedJson3;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    tipoCliente1 = new tipo_cliente_1.TipoCliente();
                    tipoCliente1.id = 1;
                    tipoCliente1.descricao = "Mensalista";
                    return [4 /*yield*/, connection.manager.save(tipoCliente1)];
                case 1:
                    _a.sent();
                    tipoCliente2 = new tipo_cliente_1.TipoCliente();
                    tipoCliente2.id = 2;
                    tipoCliente2.descricao = "XXXX";
                    return [4 /*yield*/, connection.manager.save(tipoCliente2)];
                case 2:
                    _a.sent();
                    cliente = new cliente_1.Cliente();
                    cliente.id = 1;
                    cliente.nome = "Kirliam";
                    cliente.tipo = tipoCliente1;
                    return [4 /*yield*/, connection.manager.save(cliente)];
                case 3:
                    _a.sent();
                    myReceivedJson1 = { id: 1, nome: "Kirliam changed 1", tipo: { id: 1, descricao: "Mensalista" } };
                    return [4 /*yield*/, connection.manager.getRepository(cliente_1.Cliente).save(myReceivedJson1)];
                case 4:
                    _a.sent();
                    myReceivedJson2 = { id: 1, nome: "Kirliam changed 2", tipo: { id: 1, descricao: "Mensalista" } };
                    return [4 /*yield*/, connection.manager.getRepository(cliente_1.Cliente).preload(myReceivedJson2)];
                case 5:
                    clienteDb1 = _a.sent();
                    return [4 /*yield*/, connection.manager.getRepository(cliente_1.Cliente).save(clienteDb1)];
                case 6:
                    _a.sent();
                    myReceivedJson3 = { id: 1, nome: "Kirliam changed 3", tipo: { id: 2, descricao: "XXXX" } };
                    return [4 /*yield*/, connection.manager.getRepository(cliente_1.Cliente).save(myReceivedJson3)];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); })); });
});
//# sourceMappingURL=issue-1754.js.map