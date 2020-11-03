import "reflect-metadata";

import { Connection } from "../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Bar } from "./entity/Bar";
import { Foo } from "./entity/Foo";

describe("github issues > #7002 cascade save fails if the child entity has CreateDateColumn and PK as JoinColumn", () => {
    let connections: Connection[];
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["mysql", "postgres"],
            }))
    );
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("save an entity having a child entity with shared PK and CreatedDateColumn by cascade", () =>
        Promise.all(
            connections.map(async (connection) => {
                const foo = new Foo();
                foo.text = "This is a feature post";

                await connection.manager.save(
                    connection.getRepository(Bar).create({
                        title: "Feature Post",
                        foo,
                    })
                );
            })
        ));
});
