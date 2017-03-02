import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {User} from "./entity/User";
import {createTestingConnections, reloadTestingDatabases, closeTestingConnections} from "../../../utils/test-utils";

describe("persistence > many-to-many", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    
    it("add exist element to exist object with empty one-to-many relation and save it and it should contain a new category", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);
        const userRepository = connection.getRepository(User);

        // save a new category
        const newCategory = categoryRepository.create();
        newCategory.name = "Animals";
        await categoryRepository.persist(newCategory);

        // save a new post
        const newPost = postRepository.create();
        newPost.title = "All about animals";
        await postRepository.persist(newPost);

        // save a new user
        const newUser = userRepository.create();
        newUser.name = "Dima";
        await userRepository.persist(newUser);

        // now add a category to the post and attach post to a user and save a user
        newPost.categories = [newCategory];
        newUser.post = newPost;
        await userRepository.persist(newUser);

        // load a post
        const loadedUser = await userRepository.findOneById(1, {
            join: {
                alias: "user",
                leftJoinAndSelect: { post: "user.post", categories: "post.categories" }
            }
        });

        expect(loadedUser!).not.to.be.empty;
        expect(loadedUser!.post).not.to.be.empty;
        expect(loadedUser!.post.categories).not.to.be.empty;

    })));

});
