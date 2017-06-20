import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";

import {Post} from "./entity/Post";
import {Author} from "./entity/Author";

describe("github issues > #528 Migrations failing on timestamp validation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        migrations: [__dirname + "/migrations/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    after(() => closeTestingConnections(connections));

    it("should be success migrating", () => Promise.all(connections.map(async connection => {

        const author = new Author();
        author.firstName = "Artur";
        author.lastName = "Lavrischev";

        const post = new Post();
        post.title = "Hello!";
        post.author = author;

        await connection.getRepository(Post).save(post);
        await connection.runMigrations();

    })));

});
