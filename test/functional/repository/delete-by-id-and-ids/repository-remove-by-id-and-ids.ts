import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Repository} from "../../../../src/repository/Repository";
import {Post} from "./entity/Post";
import {CreateConnectionOptions} from "../../../../src/connection-manager/CreateConnectionOptions";
import {createConnection} from "../../../../src/backend";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("repository > removeById and removeByIds methods", function() {

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
        entities: [Post]
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
    before(function() {
        postRepository = connection.getRepository(Post);
    });

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    
    describe("remove using removeById method", function() {
        let loadedPosts: Post[];
        
        before(reloadDatabase);

        // save a new posts
        before(function() {
            const newPost1 = postRepository.create();
            newPost1.title = "Super post #1";
            const newPost2 = postRepository.create();
            newPost2.title = "Super post #2";
            const newPost3 = postRepository.create();
            newPost3.title = "Super post #3";
            const newPost4 = postRepository.create();
            newPost4.title = "Super post #4";
            
            return Promise.all([
                postRepository.persist(newPost1),
                postRepository.persist(newPost2),
                postRepository.persist(newPost3),
                postRepository.persist(newPost4)
            ]);
        });

        // remove one
        before(function() {
            return postRepository.removeById(1);
        });

        // load to check
        before(function() {
            return postRepository.find().then(posts => loadedPosts = posts);
        });

        it("should delete successfully", function () {
            loadedPosts.length.should.be.equal(3);
            expect(loadedPosts.find(p => p.id === 1)).to.be.empty;
            expect(loadedPosts.find(p => p.id === 2)).not.to.be.empty;
            expect(loadedPosts.find(p => p.id === 3)).not.to.be.empty;
            expect(loadedPosts.find(p => p.id === 4)).not.to.be.empty;
        });

    });

    describe("remove using removeByIds method", function() {
        let loadedPosts: Post[];

        before(reloadDatabase);

        // save a new posts
        before(function() {
            const newPost1 = postRepository.create();
            newPost1.title = "Super post #1";
            const newPost2 = postRepository.create();
            newPost2.title = "Super post #2";
            const newPost3 = postRepository.create();
            newPost3.title = "Super post #3";
            const newPost4 = postRepository.create();
            newPost4.title = "Super post #4";

            return Promise.all([
                postRepository.persist(newPost1),
                postRepository.persist(newPost2),
                postRepository.persist(newPost3),
                postRepository.persist(newPost4)
            ]);
        });

        // remove one
        before(function() {
            return postRepository.removeByIds([2, 3]);
        });

        // load to check
        before(function() {
            return postRepository.find().then(posts => loadedPosts = posts);
        });

        it("should delete successfully", function () {
            loadedPosts.length.should.be.equal(2);
            expect(loadedPosts.find(p => p.id === 1)).not.to.be.empty;
            expect(loadedPosts.find(p => p.id === 2)).to.be.empty;
            expect(loadedPosts.find(p => p.id === 3)).to.be.empty;
            expect(loadedPosts.find(p => p.id === 4)).not.to.be.empty;
        });

    });

});