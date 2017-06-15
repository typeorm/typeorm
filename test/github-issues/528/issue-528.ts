import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

import {MigrationExecutor} from "../../../src/migration/MigrationExecutor";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";

describe("github issues > #528 Migrations failing on timestamp validation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should success migrating (without failing on timestamp navigation)", () => Promise.all(connections.map(async connection => {

        // first insert all the data
        const author = new Author();
        author.firstName = "Artur";
        author.lastName = "Lavrischev";

        const postOld = new Post();
        postOld.title = "Hello World!";
        postOld.author = author;

        const postNew = new Post();
        postNew.title = "Hello!";
        postNew.author = author;

        const postRepository = connection.getRepository(Post);

        await postRepository.save(postNew);
        await connection.runMigrations();

        // mock new Date()
        global.Date = new Proxy(Date, {
            construct(target) {
                return new target(1943, 4, 19, 15, 0, 0);
            }
        });

        await postRepository.save(postOld);
        await connection.runMigrations();

    })));

});
