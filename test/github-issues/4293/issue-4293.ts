import {expect} from "chai";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Example} from "./entity/Example";

describe("github issues > #4293 Transformer value not returned on save", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Example],
        enabledDrivers: ["mysql", "postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Still transforms value on retrieval as expected", async () => Promise.all(connections.map(async connection => {
        const entity = await connection.manager.save(Object.assign(new Example(), {name: "test"}));

        const loadedEntity = await connection.manager.findOne(Example, entity.id);
        expect(loadedEntity!.name).to.be.eql("TEST");
    })));

    it("Transforms value on entity returned from save", async () => Promise.all(connections.map(async connection => {
        const entity = await connection.manager.save(Object.assign(new Example(), {name: "test"}));

        expect(entity.name).to.be.eql("TEST");
    })));

    it("Transforms value on multiple entities returned from save", async () => Promise.all(connections.map(async connection => {
        const [foo, bar] = await connection.manager.save([
            Object.assign(new Example(), {name: "foo"}),
            Object.assign(new Example(), {name: "bar"}),
        ]);

        expect(foo.name).to.be.eql("FOO");
        expect(bar.name).to.be.eql("BAR");
    })));

    it("Transforms value on single updated entity", async () => Promise.all(connections.map(async connection => {
        const entity = await connection.manager.save(Object.assign(new Example(), {name: "test"}));
        expect(entity.name).to.be.eql("TEST");

        entity.name = "foo";
        await connection.manager.save(entity);

        expect(entity.name).to.be.eql("FOO");
    })));

    it("Transforms value on multiple updated entities", async () => Promise.all(connections.map(async connection => {
        const [foo, bar] = await connection.manager.save([
            Object.assign(new Example(), {name: "test"}),
            Object.assign(new Example(), {name: "test"}),
        ]);
        expect(foo.name).to.be.eql("TEST");
        expect(bar.name).to.be.eql("TEST");

        foo.name = "foo";
        bar.name = "bar";
        await connection.manager.save([foo, bar]);

        expect(foo.name).to.be.eql("FOO");
        expect(bar.name).to.be.eql("BAR");
    })));
});
