import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import { A } from "./entity/A";

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

    it("update with only undefined values should do nothing", () => Promise.all(connections.map(async connection => {
        // Given
        const repo = connection.getRepository(A);
        const a1 = new A();
        a1.data1 = "1";
        a1.data2 = "2";
        await repo.save(a1);

        // When
        await repo.update(a1.id, {data1: undefined, data2: undefined});

        // Then
        const a2 = await repo.findOneOrFail(a1.id);
        expect(a2.data1).to.equal("1");
        expect(a2.data2).to.equal("2");
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

    // This test cases exposes a changed behaviour. The update here
    // used to throw QueryFailedError: syntax error at or near "WHERE"
    // I think this NOOP behaviour is better since it's safer and more
    // congruent with how save() works.
    it("update with empty literal should do nothing", () => Promise.all(connections.map(async connection => {
        // Given
        const repo = connection.getRepository(A);
        const a1 = new A();
        a1.data1 = "1";
        a1.data2 = "2";
        await repo.save(a1);

        // When
        await repo.update(a1.id, {});

        // Then
        const a2 = await repo.findOneOrFail(a1.id);
        expect(a2.data1).to.equal("1");
        expect(a2.data2).to.equal("2");
    })));
});