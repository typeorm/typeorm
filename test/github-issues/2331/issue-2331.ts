import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import { A } from "./entity/A";
import "../../utils/test-setup";

describe("github issues > #2331 Inconsistent handling of undefined between save and update", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("update to an undefined value should leave the value untouched", () => Promise.all(connections.map(async connection => {
        // Given
        const repo = connection.getRepository(A);
        const a1 = new A();
        a1.data1 = "1";
        a1.data2 = "2";
        await repo.save(a1);

        // When
        await repo.update(a1.id, {data1: undefined, data2: "X"});

        // Then
        const a2 = await repo.findOneOrFail(a1.id);
        expect(a2.data1).to.equal("1");
        expect(a2.data2).to.equal("X");
    })));

    it("update to null should nullifiy the values", () => Promise.all(connections.map(async connection => {
        // Given
        const repo = connection.getRepository(A);
        const a1 = new A();
        a1.data1 = "1";
        a1.data2 = "2";
        await repo.save(a1);

        // When
        await repo.update(a1.id, {data1: null, data2: null});

        // Then
        const a2 = await repo.findOneOrFail(a1.id);
        expect(a2.data1).to.be.null;
        expect(a2.data2).to.be.null;
    })));

    // I don't like this behaviour. I think this should be a NOOP instead.
    it("update with only undefined values should throw", () => Promise.all(connections.map(async connection => {
        // Given
        const repo = connection.getRepository(A);
        const a1 = new A();
        a1.data1 = "1";
        a1.data2 = "2";
        await repo.save(a1);

        // When
        await repo.update(a1.id, {data1: undefined, data2: undefined}).should.be.rejectedWith("syntax error at or near \"WHERE\"");
    })));


    // I don't like this behaviour. I think this should be a NOOP instead. But this is current behaviour.
    it("update with empty literal should throw", () => Promise.all(connections.map(async connection => {
        // Given
        const repo = connection.getRepository(A);
        const a1 = new A();
        a1.data1 = "1";
        a1.data2 = "2";
        await repo.save(a1);

        // When
        await repo.update(a1.id, {}).should.be.rejectedWith("syntax error at or near \"WHERE\"");
    })));
});