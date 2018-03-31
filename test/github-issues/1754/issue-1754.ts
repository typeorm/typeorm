import {Cliente} from "./entity/cliente";
import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {TipoCliente} from "./entity/tipo-cliente";

describe("github issue #1754 Repository.save() always updating ManyToOne relation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work as expected", () => Promise.all(connections.map(async connection => {
        const tipoCliente = new TipoCliente();
        tipoCliente.id = 1;
        tipoCliente.descricao = "Mensalista";
        await connection.manager.save(tipoCliente);

        const cliente = new Cliente();
        cliente.id = 1;
        cliente.nome = "Kirliam";
        cliente.tipo = tipoCliente;
        await connection.manager.save(cliente);

        console.log(1);

        // The issue happens when I receive the cliente JSON from user interface
        // 1. First I tried to call save() after receive the JSON
        let myReceivedJson1 = {id: 1, nome: "Kirliam changed 1", tipo: {id: 1, descricao: "Mensalista"}};
        await connection.manager.getRepository(Cliente).save(myReceivedJson1);

        console.log(2);

        // 2. After I tried to preload the entity before saving. I was expecting that just
        // the name column to be updated, but in both cases tipoCliente is also being updated.
        let myReceivedJson2 = {id: 1, nome: "Kirliam changed 2", tipo: {id: 1, descricao: "Mensalista"}};
        let clienteDb: Cliente = await connection.manager.getRepository(Cliente).preload(myReceivedJson2) as Cliente;
        await connection.manager.getRepository(Cliente).save(clienteDb);

        // Fail just to check the query log!
        // Query from log:  UPDATE `cliente` SET `nome`=?, `tipoCliente`=?  WHERE `id`=? -- PARAMETERS: ["Kirliam changed 2",1,1]
        // expect(false, "Verificar as queries!!!").is.true;
    })));

});
