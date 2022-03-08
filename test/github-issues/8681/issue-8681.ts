import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { DeepPartial } from "../../../src";
import { Thing } from "./entity/thing.entity";
import { Item } from "./entity/item.entity";

describe("github issues > #8681 DeepPartial simplification breaks the .create() and .save() method in certain cases.", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should .save() and .create() complex deep partial entities", () => Promise.all(connections.map(async connection => {
        const myThing: DeepPartial<Thing> = {
            items: [{ id: 1 }, { id: 2 }]
        };

        const thing = connection.manager.create(Thing, myThing);
        await connection.getRepository(Thing).save(myThing);

        const items = connection.manager.create(Item, myThing.items);
        if (myThing.items) await connection.getRepository(Item).save(myThing.items);

        const dbItems = await connection.manager.find(Item);
        expect(dbItems).to.have.length(2);

        return { thing, items };

    })));

});
