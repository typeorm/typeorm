import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {Connection} from "../../src/connection/Connection";
import {createConnection, CreateConnectionOptions} from "../../src/backend";
import {Repository} from "../../src/repository/Repository";
import {Post} from "../../sample/sample1-simple-entity/entity/Post";

chai.should();
describe("insertion", function() {

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
            autoSchemaCreate: true
        },
        entities: [Post]
    };
    /*const parameters: CreateConnectionOptions = {
        driver: "postgres",
        connection: {
            host: "192.168.99.100",
            port: 5432,
            username: "test",
            password: "admin",
            database: "test",
            autoSchemaCreate: true
        },
        entities: [Post]
    };*/
    
    // connect to db
    let connection: Connection;
    before(function() {
        return createConnection(parameters)
            .then(con => connection = con)
            .catch(e => console.log("Error during connection to db: " + e, e.stack));
    });

    after(function() {
        connection.close();
    });

    // clean up database before each test
    function reloadDatabase() {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e, e.stack));
    }

    let postRepository: Repository<Post>;
    beforeEach(function() {
        postRepository = connection.getRepository(Post);
    });

    // -------------------------------------------------------------------------
    // Specifications: persist
    // -------------------------------------------------------------------------
    
    describe("basic insert functionality", function() {
        let newPost: Post, savedPost: Post;

        before(reloadDatabase);

        beforeEach(function() {
            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.likesCount = 0;
            return postRepository.persist(newPost).then(post => savedPost = post);
        });

        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });

        it("should have a new generated id after post is created", function () {
            expect(savedPost.id).not.to.be.empty;
        });

        it("should have inserted post in the database", function() {
            // postRepository.findById(savedPost.id).then(p => console.log(p));
            return postRepository.findOneById(savedPost.id).should.eventually.eql({
                id: savedPost.id,
                text: "Hello post",
                title: "this is post title",
                likesCount: 0
            });
        });

    });
    
    // todo: insert objects with different data types: boolean, dates etc.
    // todo: tests without? primary column / columns with different options

});