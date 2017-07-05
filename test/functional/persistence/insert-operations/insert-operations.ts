import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe.skip("persistence > insert operations", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("cascade insert", function() {

        it("should work perfectly", () => Promise.all(connections.map(async connection => {

            // create category
            const category1 = new Category();
            category1.name = "Category saved by cascades #1";
            // category1.onePost = post1;

            // create post
            const post1 = new Post();
            post1.title = "Hello Post #1";

            // todo(next): check out to one

            // create photos
           /* const photo1 = new Photo();
            photo1.url = "http://me.com/photo";
            photo1.post = post1;
            const photo2 = new Photo();
            photo2.url = "http://me.com/photo";
            photo2.post = post1;*/

            // post1.category = category1;
            // post1.category.photos = [photo1, photo2];
            await connection.manager.save(post1);
            await connection.manager.save(category1);

            console.log("********************************************************");

            /*const posts = await connection.manager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.category", "category")
                // .innerJoinAndSelect("post.photos", "photos")
                .getResults();

            posts[0].title = "Updated Post #1";

            console.log("********************************************************");
            console.log("posts: ", posts);

            // posts[0].category = null; // todo: uncomment to check remove
            console.log("removing post's category: ", posts[0]);
            await connection.manager.persist(posts[0]);*/

           /* await connection.manager.persist([photo1, photo2]);

            post1.photos = [photo1];
            await connection.manager.persist(post1);

            console.log("********************************************************");
            console.log("********************************************************");

            post1.photos = [photo1, photo2];

            await connection.manager.persist(post1);

            console.log("********************************************************");
            console.log("********************************************************");

            post1.title = "Updated Post";
            await connection.manager.persist(post1);*/

        })));

    });

});
