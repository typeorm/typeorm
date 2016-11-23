import "reflect-metadata";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {View} from "./entity/View";
import {Category} from "./entity/Category";
import {setupTestingConnections, closeConnections, createTestingConnectionOptions} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {CannotConnectAlreadyConnectedError} from "../../../src/connection/error/CannotConnectAlreadyConnectedError";
import {CannotCloseNotConnectedError} from "../../../src/connection/error/CannotCloseNotConnectedError";
import {CannotImportAlreadyConnectedError} from "../../../src/connection/error/CannotImportAlreadyConnectedError";
import {Repository} from "../../../src/repository/Repository";
import {TreeRepository} from "../../../src/repository/TreeRepository";
import {getConnectionManager} from "../../../src/index";
import {ConnectionOptions} from "../../../src/connection/ConnectionOptions";
import {CannotSyncNotConnectedError} from "../../../src/connection/error/CannotSyncNotConnectedError";
import {NoConnectionForRepositoryError} from "../../../src/connection/error/NoConnectionForRepositoryError";
import {RepositoryNotFoundError} from "../../../src/connection/error/RepositoryNotFoundError";
import {DefaultNamingStrategy} from "../../../src/naming-strategy/DefaultNamingStrategy";
import {FirstCustomNamingStrategy} from "./naming-strategy/FirstCustomNamingStrategy";
import {SecondCustomNamingStrategy} from "./naming-strategy/SecondCustomNamingStrategy";
import {CannotUseNamingStrategyNotConnectedError} from "../../../src/connection/error/CannotUseNamingStrategyNotConnectedError";
import {NamingStrategyNotFoundError} from "../../../src/connection/error/NamingStrategyNotFoundError";
import {RepositoryNotTreeError} from "../../../src/connection/error/RepositoryNotTreeError";
import {EntityManager} from "../../../src/entity-manager/EntityManager";
import {CannotGetEntityManagerNotConnectedError} from "../../../src/connection/error/CannotGetEntityManagerNotConnectedError";
import {Blog} from "./modules/blog/entity/Blog";
import {Question} from "./modules/question/entity/Question";
import {Video} from "./modules/video/entity/Video";

describe("Connection", () => {
    const resourceDir = __dirname + "/../../../../../test/functional/connection/";

    describe("before connection is established", function() {

        let connection: Connection;
        before(async () => {
            const options: ConnectionOptions = {
                driver: createTestingConnectionOptions("mysql"),
                entities: []
            };
            connection = await getConnectionManager().create(options);
        });
        after(() => {
            if (connection.isConnected)
                return connection.close();
            
            return Promise.resolve();
        });

        it("connection.isConnected should be false", () => {
            connection.isConnected.should.be.false;
        });

        it("entity manager and reactive entity manager should not be accessible", () => {
            expect(() => connection.entityManager).to.throw(CannotGetEntityManagerNotConnectedError);
            // expect(() => connection.reactiveEntityManager).to.throw(CannotGetEntityManagerNotConnectedError);
        });

        // todo: they aren't promises anymore
        /*it("import entities, entity schemas, subscribers and naming strategies should work", () => {
            return Promise.all([
                connection.importEntities([Post]).should.be.fulfilled,
                connection.importEntitySchemas([]).should.be.fulfilled,
                connection.importSubscribers([]).should.be.fulfilled,
                connection.importNamingStrategies([]).should.be.fulfilled,
                connection.importEntitiesFromDirectories([]).should.be.fulfilled,
                connection.importEntitySchemaFromDirectories([]).should.be.fulfilled,
                connection.importSubscribersFromDirectories([]).should.be.fulfilled,
                connection.importNamingStrategiesFromDirectories([]).should.be.fulfilled
            ]);
        });*/

        it("should not be able to close", () => {
            return connection.close().should.be.rejectedWith(CannotCloseNotConnectedError);
        });

        it("should not be able to sync a schema", () => {
            return connection.syncSchema().should.be.rejectedWith(CannotSyncNotConnectedError);
        });

        it("should not be able to use repositories", () => {
            expect(() => connection.getRepository(Post)).to.throw(NoConnectionForRepositoryError);
            expect(() => connection.getTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
            // expect(() => connection.getReactiveRepository(Post)).to.throw(NoConnectionForRepositoryError);
            // expect(() => connection.getReactiveTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
        });

        it("should be able to connect", () => {
            return connection.connect().should.be.fulfilled;
        });

    });

    describe("after connection is established successfully", function() {

        let connections: Connection[];
        beforeEach(() => setupTestingConnections({ entities: [Post, Category], schemaCreate: true }).then(all => connections = all));
        afterEach(() => closeConnections(connections));

        it("connection.isConnected should be true", () => connections.forEach(connection => {
            connection.isConnected.should.be.true;
        }));

        it("entity manager and reactive entity manager should be accessible", () => connections.forEach(connection => {
            expect(connection.entityManager).to.be.instanceOf(EntityManager);
            // expect(connection.reactiveEntityManager).to.be.instanceOf(ReactiveEntityManager);
        }));

        // todo: they aren't promises anymore
        it("import entities, entity schemas, subscribers and naming strategies should not be possible once connection is done", () => connections.forEach(connection => {
            expect(() => connection.importEntities([Post])).to.throw(CannotImportAlreadyConnectedError);
            expect(() => connection.importEntitySchemas([])).to.throw(CannotImportAlreadyConnectedError);
            expect(() => connection.importSubscribers([])).to.throw(CannotImportAlreadyConnectedError);
            expect(() => connection.importNamingStrategies([])).to.throw(CannotImportAlreadyConnectedError);
            expect(() => connection.importEntitiesFromDirectories([])).to.throw(CannotImportAlreadyConnectedError);
            expect(() => connection.importEntitySchemaFromDirectories([])).to.throw(CannotImportAlreadyConnectedError);
            expect(() => connection.importSubscribersFromDirectories([])).to.throw(CannotImportAlreadyConnectedError);
            expect(() => connection.importNamingStrategiesFromDirectories([])).to.throw(CannotImportAlreadyConnectedError);
        }));

        it("should not be able to connect again", () => connections.forEach(connection => {
            return connection.connect().should.be.rejectedWith(CannotConnectAlreadyConnectedError);
        }));

        it("should not be able to change used naming strategy", () => connections.forEach(connection => {
            expect(() => connection.useNamingStrategy("something")).to.throw(CannotUseNamingStrategyNotConnectedError);
        }));

        it("should be able to close a connection", async () => Promise.all(connections.map(connection => {
            return connection.close();
        })));

    });

    describe("working with repositories after connection is established successfully", function() {

        let connections: Connection[];
        before(() => setupTestingConnections({ entities: [Post, Category], schemaCreate: true }).then(all => connections = all));
        after(() => closeConnections(connections));

        it("should be able to get simple entity repository", () => connections.forEach(connection => {
            connection.getRepository(Post).should.be.instanceOf(Repository);
            connection.getRepository(Post).should.not.be.instanceOf(TreeRepository);
            connection.getRepository(Post).target.should.be.eql(Post);
        }));

        it("should be able to get tree entity repository", () => connections.forEach(connection => {
            connection.getTreeRepository(Category).should.be.instanceOf(TreeRepository);
            connection.getTreeRepository(Category).target.should.be.eql(Category);
        }));

        // it("should be able to get simple entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveRepository(Post).should.be.instanceOf(ReactiveRepository);
        //     connection.getReactiveRepository(Post).should.not.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveRepository(Post).target.should.be.eql(Post);
        // }));

        // it("should be able to get tree entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveTreeRepository(Category).should.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveTreeRepository(Category).target.should.be.eql(Category);
        // }));

        it("should not be able to get tree entity repository of the non-tree entities", () => connections.forEach(connection => {
            expect(() => connection.getTreeRepository(Post)).to.throw(RepositoryNotTreeError);
            // expect(() => connection.getReactiveTreeRepository(Post)).to.throw(RepositoryNotTreeError);
        }));

        it("should not be able to get repositories that are not registered", () => connections.forEach(connection => {
            expect(() => connection.getRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
            expect(() => connection.getTreeRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
            // expect(() => connection.getReactiveRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
            // expect(() => connection.getReactiveTreeRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
        }));

    });

    describe("generate a schema when connection.syncSchema is called", function() {

        let connections: Connection[];
        beforeEach(() => setupTestingConnections({ entities: [Post], schemaCreate: true }).then(all => connections = all));
        afterEach(() => closeConnections(connections));

        it("database should be empty after schema is synced with dropDatabase flag", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const post = new Post();
            post.title = "new post";
            await postRepository.persist(post);
            const loadedPost = await postRepository.findOneById(post.id);
            expect(loadedPost).to.be.eql(post);
            await connection.syncSchema(true);
            const againLoadedPost = await postRepository.findOneById(post.id);
            expect(againLoadedPost).to.be.empty;
        })));

    });

    describe("after connection is closed successfully", function() {

        // open a close connections
        let connections: Connection[] = [];
        before(() => setupTestingConnections({ entities: [Post], schemaCreate: true }).then(all => {
            connections = all;
            return Promise.all(connections.map(connection => connection.close()));
        }));
        
        it("should not be able to close already closed connection", () => connections.forEach(connection => {
            return connection.close().should.be.rejectedWith(CannotCloseNotConnectedError);
        }));

        it("connection.isConnected should be false", () => connections.forEach(connection => {
            connection.isConnected.should.be.false;
        }));

    });

    describe("import entities and entity schemas", function() {

        let firstConnection: Connection, secondConnection: Connection;
        beforeEach(async () => {
            firstConnection = await getConnectionManager().create({
                driver: createTestingConnectionOptions("mysql"),
                name: "firstConnection"
            });
            secondConnection = await getConnectionManager().create({
                driver: createTestingConnectionOptions("mysql"),
                name: "secondConnection"
            });
        });

        it("should import first connection's entities only", async () => {
            firstConnection.importEntities([Post]);
            await firstConnection.connect();
            firstConnection.getRepository(Post).should.be.instanceOf(Repository);
            firstConnection.getRepository(Post).target.should.be.equal(Post);
            expect(() => firstConnection.getRepository(Category)).to.throw(RepositoryNotFoundError);
            await firstConnection.close();
        });

        it("should import second connection's entities only", async () => {
            secondConnection.importEntities([Category]);
            await secondConnection.connect();
            secondConnection.getRepository(Category).should.be.instanceOf(Repository);
            secondConnection.getRepository(Category).target.should.be.equal(Category);
            expect(() => secondConnection.getRepository(Post)).to.throw(RepositoryNotFoundError);
            await secondConnection.close();
        });

        it("should import first connection's entity schemas only", async () => {
            firstConnection.importEntitySchemas([ require(resourceDir + "schema/user.json") ]);
            await firstConnection.connect();
            firstConnection.getRepository("User").should.be.instanceOf(Repository);
            firstConnection.getRepository("User").target.should.be.equal("User");
            expect(() => firstConnection.getRepository("Photo")).to.throw(RepositoryNotFoundError);
            await firstConnection.close();
        });

        it("should import second connection's entity schemas only", async () => {
            secondConnection.importEntitySchemas([ require(resourceDir + "schema/photo.json") ]);
            await secondConnection.connect();
            secondConnection.getRepository("Photo").should.be.instanceOf(Repository);
            secondConnection.getRepository("Photo").target.should.be.equal("Photo");
            expect(() => secondConnection.getRepository("User")).to.throw(RepositoryNotFoundError);
            await secondConnection.close();
        });

    });

    describe("import entities / entity schemas / subscribers / naming strategies from directories", function() {

        let connection: Connection;
        beforeEach(async () => {
            connection = await getConnectionManager().create({
                driver: createTestingConnectionOptions("mysql")
            });
        });
        afterEach(() => connection.isConnected ? connection.close() : {});

        it("should successfully load entities / entity schemas / subscribers / naming strategies from directories", async () => {
            connection.importEntitiesFromDirectories([__dirname + "/entity/*"]);
            connection.importEntitySchemaFromDirectories([resourceDir + "/schema/*"]);
            connection.importNamingStrategiesFromDirectories([__dirname + "/naming-strategy/*"]);
            connection.importSubscribersFromDirectories([__dirname + "/subscriber/*"]);
            await connection.connect();
            connection.getRepository(Post).should.be.instanceOf(Repository);
            connection.getRepository(Post).target.should.be.equal(Post);
            connection.getRepository(Category).should.be.instanceOf(Repository);
            connection.getRepository(Category).target.should.be.equal(Category);
            connection.getRepository("User").should.be.instanceOf(Repository);
            connection.getRepository("User").target.should.be.equal("User");
            connection.getRepository("Photo").should.be.instanceOf(Repository);
            connection.getRepository("Photo").target.should.be.equal("Photo");
        });

        it("should successfully load entities / entity schemas / subscribers / naming strategies from glob-patterned directories", async () => {
            connection.importEntitiesFromDirectories([__dirname + "/modules/**/entity/*"]);
            connection.importEntitySchemaFromDirectories([resourceDir + "/modules/**/schema/*"]);
            connection.importNamingStrategiesFromDirectories([__dirname + "/modules/**/naming-strategy/*"]);
            connection.importSubscribersFromDirectories([__dirname + "/modules/**/subscriber/*"]);
            await connection.connect();
            connection.getRepository(Blog).should.be.instanceOf(Repository);
            connection.getRepository(Blog).target.should.be.equal(Blog);
            connection.getRepository(Question).should.be.instanceOf(Repository);
            connection.getRepository(Question).target.should.be.equal(Question);
            connection.getRepository(Video).should.be.instanceOf(Repository);
            connection.getRepository(Video).target.should.be.equal(Video);
            connection.getRepository("BlogCategory").should.be.instanceOf(Repository);
            connection.getRepository("BlogCategory").target.should.be.equal("BlogCategory");
            connection.getRepository("QuestionCategory").should.be.instanceOf(Repository);
            connection.getRepository("QuestionCategory").target.should.be.equal("QuestionCategory");
            connection.getRepository("VideoCategory").should.be.instanceOf(Repository);
            connection.getRepository("VideoCategory").target.should.be.equal("VideoCategory");
        });
    });

    describe("using naming strategy", function() {

        let connection: Connection;
        beforeEach(async () => {
            connection = await getConnectionManager().create({
                driver: createTestingConnectionOptions("mysql")
            });
        });
        afterEach(() => connection.isConnected ? connection.close() : {});

        it("should use naming strategy when its class passed to useNamingStrategy method", async () => {
            connection.importEntities([Post]);
            connection.importNamingStrategies([FirstCustomNamingStrategy]);
            connection.useNamingStrategy(FirstCustomNamingStrategy);
            await connection.connect();
            connection.getMetadata(Post).table.name.should.be.equal("POST");
        });

        it("should use naming strategy when its name passed to useNamingStrategy method", async () => {
            connection.importEntities([Category]);
            connection.importNamingStrategies([SecondCustomNamingStrategy]);
            connection.useNamingStrategy("secondCustomNamingStrategy");
            await connection.connect();
            connection.getMetadata(Category).table.name.should.be.equal("category");
        });

        it("should throw an error if not registered naming strategy was used (assert by name)", () => {
            connection.importEntities([Category]);
            connection.importNamingStrategies([FirstCustomNamingStrategy]);
            connection.useNamingStrategy("secondCustomNamingStrategy");
            return connection.connect().should.be.rejectedWith(NamingStrategyNotFoundError);
        });

        it("should throw an error if not registered naming strategy was used (assert by Function)", () => {
            connection.importEntities([Category]);
            connection.importNamingStrategies([SecondCustomNamingStrategy]);
            connection.useNamingStrategy(FirstCustomNamingStrategy);
            return connection.connect().should.be.rejectedWith(NamingStrategyNotFoundError);
        });

    });

    describe("skip schema generation when skipSchemaSync option is used", function() {

        let connections: Connection[];
        beforeEach(() => setupTestingConnections({ entities: [View] }).then(all => connections = all));
        afterEach(() => closeConnections(connections));
        it("database should be empty after schema sync", () => Promise.all(connections.map(async connection => {
            await connection.syncSchema(true);
            const queryRunner = await connection.driver.createQueryRunner();
            let schema = await queryRunner.loadSchemaTables(["view"], new DefaultNamingStrategy());
            expect(schema.some(table => table.name === "view")).to.be.false;
        })));

    });

    describe("transaction function that accepts multiple entity parameters", function() {
        let connections: Connection[];
        beforeEach(() => setupTestingConnections({ entities: [View] }).then(all => connections = all));

        afterEach(() => closeConnections(connections));
        it("executed queries must success", () => Promise.all(connections.map(async connection => {
            const blogRepository = connection.getRepository(Blog);
            let blogs = await blogRepository.find();
            blogs.should.be.eql([]);
            const postRepository = connection.getRepository(Post);
            let posts = await postRepository.find();
            posts.should.be.eql([]);

            const blog = new Blog();
            blog.name = "hello blog title";
            await blogRepository.persist(blog);
            blogs.should.be.eql([]);

            blogs = await blogRepository.find();
            blogs.length.should.be.equal(1);

            const post = new Post();
            post.title = "hello blog title";
            await postRepository.persist(post);
            posts.should.be.eql([]);

            posts = await postRepository.find();
            posts.length.should.be.equal(1);

            await connection.transaction([Blog, Post], async ([BlogRepository, PostRepository]) => {
                await _.range(0, 100).map(async i => {
                    const blog = new Blog();
                    const post = new Post();
                    blog.name = "hello blog #" + i;
                    await BlogRepository.persist(blog);
                    return PostRepository.persist(post);
                });

                blogs = await BlogRepository.find();
                blogs.length.should.be.equal(101);
                posts = await PostRepository.find();
                posts.length.should.be.equal(101);
            }).should.be.rejected;

            blogs = await blogRepository.find();
            blogs.length.should.be.equal(101);
            posts = await postRepository.find();
            posts.length.should.be.equal(101);
        })));

        it("executed queries must rollback in the case if error in transaction", () => Promise.all(connections.map(async connection => {
            const blogRepository = connection.getRepository(Blog);
            let blogs = await blogRepository.find();
            blogs.should.be.eql([]);
            const postRepository = connection.getRepository(Post);
            let posts = await postRepository.find();
            posts.should.be.eql([]);

            const blog = new Blog();
            blog.name = "hello blog title";
            await blogRepository.persist(blog);
            blogs.should.be.eql([]);

            blogs = await blogRepository.find();
            blogs.length.should.be.equal(1);

            const post = new Post();
            post.title = "hello blog title";
            await postRepository.persist(post);
            posts.should.be.eql([]);

            posts = await postRepository.find();
            posts.length.should.be.equal(1);

            await connection.transaction([Blog, Post], async ([BlogRepository, PostRepository]) => {
                await _.range(0, 100).map(async i => {
                    const blog = new Blog();
                    const post = new Post();
                    blog.name = "hello blog #" + i;
                    await BlogRepository.persist(blog);
                    return PostRepository.persist(post);
                });

                blogs = await BlogRepository.find();
                blogs.length.should.be.equal(101);
                posts = await PostRepository.find();
                posts.length.should.be.equal(101);

                throw new Error("this error will cancel all persist operations");
            }).should.be.rejected;

            blogs = await blogRepository.find();
            blogs.length.should.be.equal(1);
            posts = await postRepository.find();
            posts.length.should.be.equal(1);
        })));
    });
    
});