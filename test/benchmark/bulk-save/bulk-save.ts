import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Post} from "./entity/Post";

describe.skip("benchmark > bulk-save", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));


    it("testing bulk save of 1000 objects", () => Promise.all(connections.map(async connection => {

        const posts: Post[] = [];

        for (let i = 1; i <= 1000; i++) {
            const post = new Post();
            post.title = `Post #${i}`;
            post.text = `Post #${i} text`;
            post.likesCount = i;
            post.commentsCount = i;
            post.watchesCount = i;
            posts.push(post);
        }

        await connection.manager.save(posts);

    })));

    /**
     * Before getters refactoring
     *
     √ testing bulk save of 1000 objects (3149ms)
     √ testing bulk save of 1000 objects (2008ms)
     √ testing bulk save of 1000 objects (1893ms)
     √ testing bulk save of 1000 objects (1744ms)
     √ testing bulk save of 1000 objects (1836ms)
     √ testing bulk save of 1000 objects (1787ms)
     √ testing bulk save of 1000 objects (1904ms)
     √ testing bulk save of 1000 objects (1848ms)
     √ testing bulk save of 1000 objects (1947ms)
     √ testing bulk save of 1000 objects (2004ms)
     */

});