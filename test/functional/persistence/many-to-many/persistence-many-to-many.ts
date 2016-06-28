import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Repository} from "../../../../src/repository/Repository";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {CreateConnectionOptions} from "../../../../src/connection-manager/CreateConnectionOptions";
import {createConnection} from "../../../../src/backend";
import {User} from "./entity/User";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("persistence > many-to-many", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    const parameters: CreateConnectionOptions = {
        driver: "mysql",
        connection: {
            host: "192.168.99.100",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test",
            autoSchemaCreate: true,
            logging: {
                logFailedQueryError: true
            }
        },
        entities: [Post, Category, User]
    };
    // connect to db
    let connection: Connection;
    before(function() {
        return createConnection(parameters)
            .then(con => connection = con)
            .catch(e => {
                console.log("Error during connection to db: " + e);
                throw e;
            });
    });

    after(function() {
        connection.close();
    });

    // clean up database before each test
    function reloadDatabase() {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e));
    }

    let postRepository: Repository<Post>;
    let categoryRepository: Repository<Category>;
    let userRepository: Repository<User>;
    before(function() {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
        userRepository = connection.getRepository(User);
    });

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    
    describe("add exist element to exist object with empty one-to-many relation and save it", function() {
        let newPost: Post, newCategory: Category, newUser: User, loadedUser: User;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            return categoryRepository.persist(newCategory);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.persist(newPost);
        });

        // save a new user
        before(function() {
            newUser = userRepository.create();
            newUser.name = "Dima";
            return userRepository.persist(newUser);
        });

        // now add a category to the post and attach post to a user and save a user
        before(function() {
            newPost.categories = [newCategory];
            newUser.post = newPost;
            return userRepository.persist(newUser);
        });

        // load a post
        before(function() {
            return userRepository
                .findOneById(1, { alias: "user", leftJoinAndSelect: { post: "user.post", categories: "post.categories" } })
                .then(post => loadedUser = post);
        });

        it("should contain a new category", function () {
            expect(loadedUser).not.to.be.empty;
            expect(loadedUser.post).not.to.be.empty;
            expect(loadedUser.post.categories).not.to.be.empty;
        });

    });

});