import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {User} from "./entity/User";
import {createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("persistence > many-to-many.", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["mysql", "mariadb", "postgres", "mssql", "oracle", "websql", "sqlite"],
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        driverSpecific: {
            logging: ["info"]
        }
    }));
    beforeEach(async () => await reloadTestingDatabases(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("add exist element to exist object and save it and it should contain a new category",
        async () => await Promise.all(connections.map(async connection => {

            const postRepository = connection.getRepository(Post),
                categoryRepository = connection.getRepository(Category),
                userRepository = connection.getRepository(User),
                newCategory = categoryRepository.create(),
                newPost = postRepository.create(),
                newUser = userRepository.create();

            // save a new category
            newCategory.name = "Animals";
            await categoryRepository.save(newCategory);
            // save a new post
            newPost.title = "All about animals";
            await postRepository.save(newPost);
            // save a new user
            newUser.name = "Dima";
            await userRepository.save(newUser);

            if (!newCategory.name) console.warn("newCategory is empty!!!");
            if (!newPost.title) console.warn("newPost is empty!!!");

            // now add a category to the post and attach post to a user and save a user
            newPost.categories = [newCategory];
            await postRepository.save(newPost);

            newUser.post = newPost;
            await userRepository.save(newUser);

            // load a post
            const loadedUser = await userRepository.findOneById(1, {
                join: {
                    alias: "user",
                    leftJoinAndSelect: {post: "user.post", categories: "post.categories"}
                }
            });
            await connection.close();

            expect(connection.isConnected).to.be.false;
            expect(loadedUser!).not.to.be.empty;
            expect(loadedUser!.post).not.to.be.empty;
            expect(loadedUser!.post.categories).not.to.be.empty;
        })));
});
