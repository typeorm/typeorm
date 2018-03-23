import "reflect-metadata";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {BaseEntity} from "../../../src/repository/BaseEntity";

describe("github issues > #1261 onDelete property on foreign key is not modified on sync", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    after(() => closeTestingConnections(connections));

    it("should order by added selects when pagination is used", () => Promise.all(connections.map(async connection => {
        await connection.synchronize();
        BaseEntity.useConnection(connection);

        // const foo = new Foo();
        // const bar = new Bar();
        // bar.foo = foo;
        // await foo.save();
        // await bar.save();
        // await foo.remove();
        // const relation = connection.getMetadata(Bar).relations.find(relation => relation.propertyName === "foo");
        // relation.onDelete = "SET NULL";
        // await connection.synchronize();

    })));

});
